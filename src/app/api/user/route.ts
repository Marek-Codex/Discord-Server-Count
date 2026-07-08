import { NextRequest, NextResponse } from 'next/server'
import { getDiscordConfig } from '@/lib/config'
import { getDiscordAccount } from '@/lib/discord'
import { SESSION_COOKIE, sessionCookie, unsealSession } from '@/lib/session'
import { incrementCount } from '@/lib/stats'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!getDiscordConfig()) {
    return NextResponse.json(
      { authenticated: false, error: 'Discord is not configured' },
      { status: 503 },
    )
  }
  const session = unsealSession(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session.accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const account = await getDiscordAccount(session.accessToken)
    if (!session.countedUsage) {
      await incrementCount()
      session.countedUsage = true
    }
    const response = NextResponse.json({ authenticated: true, ...account })
    response.cookies.set(sessionCookie(session))
    return response
  } catch (error) {
    console.error('Unable to load Discord account:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Discord account unavailable' },
      { status: 502 },
    )
  }
}
