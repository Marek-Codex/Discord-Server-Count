import type { DiscordConfig } from '@/lib/config'

const API = 'https://discord.com/api/v10'

export type DiscordUser = {
  avatar: string | null
  id: string
  username: string
}

async function discordFetch<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Discord API request failed with ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function createDiscordLoginUrl(config: DiscordConfig, state: string) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'consent',
  })
  return `https://discord.com/oauth2/authorize?${params}`
}

export async function exchangeDiscordCode(
  config: DiscordConfig,
  code: string,
) {
  const response = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`Discord token exchange failed with ${response.status}`)
  }
  return response.json() as Promise<{
    access_token: string
    expires_in: number
  }>
}

export async function getDiscordAccount(token: string) {
  const [user, guilds] = await Promise.all([
    discordFetch<DiscordUser>('/users/@me', token),
    discordFetch<unknown[]>('/users/@me/guilds', token),
  ])
  return { user, guildCount: guilds.length }
}
