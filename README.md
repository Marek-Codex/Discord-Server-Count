# Discord Server Count

![Node.js](https://img.shields.io/badge/node.js-18%2B-3CA0FF)
![Express](https://img.shields.io/badge/express-4.x-5865F2)
![OAuth](https://img.shields.io/badge/discord-oauth-5865F2)
![YAGNI](https://img.shields.io/badge/yagni-mostly-3CA0FF)

![README visits](https://count.getloli.com/@marek-codex.discord-server-count?theme=booru-lewd)

Tiny Discord OAuth utility that counts how many servers your account is in.

No account system. No settings maze. No dashboard-industrial complex quietly assembling a council in the next room. Discord hands over the guild list, the app counts it, and you get the number.

**Live:** [discord-server-count.vercel.app](https://discord-server-count.vercel.app)

## What It Does

1. Log in with Discord.
2. Fetch your basic profile and guild list.
3. Count the guilds.
4. Show the result.

Wicked elaborate, I know.

## Privacy-ish Notes

The app requests only `identify` and `guilds`.

It does not ask for your password, messages, billing info, or permission to rearrange your life. The session cookie stores the OAuth result long enough for the dashboard to load. The generated-count stat stores only a total number of successful count generations.

## Stack

- **Runtime:** Node.js
- **Server:** Express
- **Auth:** Discord OAuth2
- **Client:** HTML, CSS, vanilla JavaScript
- **Storage:** Upstash Redis for the live generated-count stat, local JSON fallback for development

## Local Setup

Create a Discord application in the [Discord Developer Portal](https://discord.com/developers/applications), then add this redirect URI:

```text
http://localhost:3000/callback
```

Copy `.env.example` to `.env` and fill in the values:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/callback
SESSION_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Install, run, and check:

```bash
npm install
npm start
npm run check
```

Open `http://localhost:3000`.

## Production

- Use HTTPS.
- Set `NODE_ENV=production`.
- Set `DISCORD_REDIRECT_URI` to your live `/callback` URL.
- Add that same callback URL in the Discord Developer Portal.
- Set a long random `SESSION_SECRET`.
- Add `KV_REST_API_URL` and `KV_REST_API_TOKEN` for durable generated-count stats.

Vercel Marketplace’s Upstash Redis integration provides the `KV_*` variables automatically.

## Assets

```bash
npm run icons
npm run social
npm run assets
```

## Credit

Inspired by [NobreHD/Discord-Server-Count](https://github.com/NobreHD/Discord-Server-Count), with a different stack and a mildly suspicious access-node coat of paint.
