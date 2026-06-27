# Discord Server Count

![Node.js](https://img.shields.io/badge/node.js-18%2B-3CA0FF)
![Express](https://img.shields.io/badge/express-4.x-5865F2)
![OAuth](https://img.shields.io/badge/discord-oauth-5865F2)
![YAGNI](https://img.shields.io/badge/yagni-mostly-3CA0FF)

![README visits](https://count.getloli.com/@marek-codex.discord-server-count?theme=booru-lewd)

Tiny Discord OAuth utility that counts how many servers your account is in.

No account system. No settings maze. No dashboard-industrial complex quietly assembling a council in the next room. Discord tells the app your server list, the app counts it, and the dashboard shows the number.

> Live: [discord-server-count.vercel.app](https://discord-server-count.vercel.app)

## What It Does

1. You log in with Discord.
2. Discord returns your basic profile and guild list.
3. The app counts the guilds.
4. You get the number.

Wicked elaborate, I know.

## Why Login?

Discord has the server list. The app cannot count what Discord does not hand over.

This app requests the `identify` and `guilds` scopes only. It does not ask for your password, messages, billing info, or permission to rearrange your life. It uses a temporary session so the dashboard can load, then gets out of the way like a polite little access node.

## Features

- Discord OAuth with `identify guilds`
- Server count dashboard
- Session-only login
- Lightweight generated-count stat
- Animated plexus background
- Transparent favicon set
- Creator, source, and Ko-fi footer links

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
# Optional for a durable generated-count stat in production:
KV_REST_API_URL=your_upstash_rest_url
KV_REST_API_TOKEN=your_upstash_rest_token
```

Install and run:

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

Quick syntax check:

```bash
npm run check
```

## Production Notes

- Use HTTPS.
- Set `NODE_ENV=production`.
- Set `DISCORD_REDIRECT_URI` to your live `/callback` URL, such as `https://discord-server-count.vercel.app/callback`.
- Add the same live callback URL in the Discord Developer Portal.
- Use a long random `SESSION_SECRET`.
- Add Upstash Redis env vars for a durable generated-count stat. Vercel Marketplace usually provides `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

The generated-count stat stores only a total number. It does not store Discord credentials, user profiles, or guild lists. Locally, `data/stats.json` is used as a development fallback.

## Credit

Inspired by [NobreHD/Discord-Server-Count](https://github.com/NobreHD/Discord-Server-Count), with a different stack and a mildly suspicious access-node coat of paint.
