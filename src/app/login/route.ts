import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDiscordConfig } from '@/lib/config'
import { createDiscordLoginUrl } from '@/lib/discord'
import { sessionCookie } from '@/lib/session'

export function GET(request: Request) {
  const config = getDiscordConfig()
  if (!config) return NextResponse.redirect(new URL('/?error=config', request.url))

  const state = crypto.randomBytes(32).toString('hex')
  const response = NextResponse.redirect(createDiscordLoginUrl(config, state))
  response.cookies.set(sessionCookie({ oauthState: state }))
  return response
}
