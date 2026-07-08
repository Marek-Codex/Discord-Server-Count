import { NextRequest, NextResponse } from 'next/server'
import { getDiscordConfig } from '@/lib/config'
import { exchangeDiscordCode } from '@/lib/discord'
import { SESSION_COOKIE, sessionCookie, unsealSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const config = getDiscordConfig()
  if (!config) return NextResponse.redirect(new URL('/?error=config', request.url))

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const session = unsealSession(request.cookies.get(SESSION_COOKIE)?.value)
  if (!code || !state || state !== session.oauthState) {
    return NextResponse.redirect(new URL('/?error=state', request.url))
  }

  try {
    const token = await exchangeDiscordCode(config, code)
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set(
      sessionCookie({
        accessToken: token.access_token,
        tokenExpiry: Date.now() + token.expires_in * 1000,
        countedUsage: false,
      }),
    )
    return response
  } catch (error) {
    console.error('Discord token exchange failed:', error)
    return NextResponse.redirect(new URL('/?error=auth', request.url))
  }
}
