const discordKeys = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_REDIRECT_URI',
] as const

export function getDiscordConfig() {
  if (discordKeys.some((key) => !process.env[key])) return null

  return {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    redirectUri: process.env.DISCORD_REDIRECT_URI!,
  }
}

export type DiscordConfig = NonNullable<ReturnType<typeof getDiscordConfig>>

export function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be configured in production')
  }
  return 'development-only-session-secret-change-me'
}

export function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  return url && token ? { url, token } : null
}
