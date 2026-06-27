require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Redis } = require('@upstash/redis');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const statsPath = path.join(__dirname, 'data', 'stats.json');
const statsKey = 'discord-server-count:counts-generated';

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  SESSION_SECRET,
  NODE_ENV,
  KV_REST_API_URL,
  KV_REST_API_TOKEN,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN
} = process.env;

const hasDiscordConfig = Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && DISCORD_REDIRECT_URI);
const redisUrl = UPSTASH_REDIS_REST_URL || KV_REST_API_URL;
const redisToken = UPSTASH_REDIS_REST_TOKEN || KV_REST_API_TOKEN;
const hasRedisConfig = Boolean(redisUrl && redisToken);
const sessionSecret = SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const cookieName = 'dsc_session';
const cookieMaxAge = 1000 * 60 * 60 * 24 * 7;
const redis = hasRedisConfig ? new Redis({ url: redisUrl, token: redisToken }) : null;

if (!hasDiscordConfig) {
  console.warn('Discord OAuth is not configured. Login routes will be unavailable.');
}

if (!SESSION_SECRET) {
  console.warn('SESSION_SECRET is not configured. Sessions will reset when the server restarts.');
}

if (!hasRedisConfig && NODE_ENV === 'production') {
  console.warn('Upstash Redis is not configured. Counts generated will use non-durable file fallback.');
}

app.use(express.static(path.join(__dirname, 'public')));

function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

function getKey() {
  return crypto.createHash('sha256').update(sessionSecret).digest();
}

function encodeBase64Url(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url');
}

function sealSession(sessionData) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(sessionData), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return [
    encodeBase64Url(iv),
    encodeBase64Url(tag),
    encodeBase64Url(encrypted)
  ].join('.');
}

function unsealSession(value) {
  if (!value) return {};

  try {
    const [iv, tag, encrypted] = value.split('.').map(decodeBase64Url);
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return {};
  }
}

function parseCookies(req) {
  return (req.headers.cookie || '')
    .split(';')
    .map(cookie => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const separatorIndex = cookie.indexOf('=');
      if (separatorIndex === -1) return cookies;

      const name = cookie.slice(0, separatorIndex);
      const value = cookie.slice(separatorIndex + 1);
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function getAppSession(req) {
  return unsealSession(parseCookies(req)[cookieName]);
}

function setAppSession(res, sessionData) {
  const secure = NODE_ENV === 'production' ? '; Secure' : '';
  const value = encodeURIComponent(sealSession(sessionData));
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=${value}; Max-Age=${Math.floor(cookieMaxAge / 1000)}; Path=/; HttpOnly; SameSite=Lax${secure}`
  );
}

function clearAppSession(res) {
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
  );
}

async function readStats() {
  if (redis) {
    const countsGenerated = Number(await redis.get(statsKey));
    return {
      countsGenerated: Number.isFinite(countsGenerated) ? countsGenerated : 0,
      durable: true
    };
  }

  try {
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    return {
      countsGenerated: Number.isInteger(stats.countsGenerated) ? stats.countsGenerated : 0,
      durable: false
    };
  } catch {
    return { countsGenerated: 0, durable: false };
  }
}

async function writeStats(stats) {
  if (redis) {
    await redis.set(statsKey, stats.countsGenerated);
    return;
  }

  try {
    fs.mkdirSync(path.dirname(statsPath), { recursive: true });
    fs.writeFileSync(
      statsPath,
      JSON.stringify({ countsGenerated: stats.countsGenerated }, null, 2)
    );
  } catch (error) {
    console.warn('Unable to write stats:', error.message);
  }
}

async function incrementCountsGenerated(appSession) {
  if (appSession.countedUsage) {
    return readStats();
  }

  const stats = redis
    ? { countsGenerated: await redis.incr(statsKey), durable: true }
    : await readStats();

  if (!redis) {
    stats.countsGenerated += 1;
    await writeStats(stats);
  }

  appSession.countedUsage = true;
  return stats;
}

function requireDiscordConfig(req, res, next) {
  if (!hasDiscordConfig) {
    return res.status(503).send('Discord OAuth is not configured yet.');
  }

  next();
}

app.get('/login', requireDiscordConfig, (req, res) => {
  const state = generateState();
  setAppSession(res, { oauthState: state });

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
    state: state,
    prompt: 'consent'
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

app.get('/callback', requireDiscordConfig, async (req, res) => {
  const { code, state } = req.query;
  const appSession = getAppSession(req);

  if (!code) {
    return res.status(400).send('No code provided');
  }

  if (state !== appSession.oauthState) {
    return res.status(403).send('Invalid state parameter');
  }

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    setAppSession(res, {
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiry: Date.now() + expires_in * 1000,
      countedUsage: false
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/user', requireDiscordConfig, async (req, res) => {
  const appSession = getAppSession(req);

  if (!appSession.accessToken) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const [userResponse, guildsResponse] = await Promise.all([
      axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${appSession.accessToken}` }
      }),
      axios.get('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${appSession.accessToken}` }
      })
    ]);
    await incrementCountsGenerated(appSession);
    setAppSession(res, appSession);

    res.json({
      authenticated: true,
      user: userResponse.data,
      guildCount: guildsResponse.data.length,
      guilds: guildsResponse.data.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null
      }))
    });
  } catch (error) {
    console.error('Failed to fetch user data:', error.response?.data || error.message);
    res.status(500).json({ authenticated: false, error: 'Failed to fetch data' });
  }
});

app.get('/api/stats', async (req, res) => {
  res.json(await readStats());
});

app.get('/logout', (req, res) => {
  clearAppSession(res);
  res.redirect('/');
});

app.get('/dashboard', (req, res) => {
  if (!getAppSession(req).accessToken) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/', (req, res) => {
  if (getAppSession(req).accessToken) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
