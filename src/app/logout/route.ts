import { NextResponse } from 'next/server'
import { expiredSessionCookie } from '@/lib/session'

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set(expiredSessionCookie())
  return response
}
