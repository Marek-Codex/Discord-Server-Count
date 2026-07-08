import crypto from 'node:crypto'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { getSessionSecret } from '@/lib/config'

export const SESSION_COOKIE = 'dsc_session'

export type AppSession = {
  accessToken?: string
  countedUsage?: boolean
  oauthState?: string
  tokenExpiry?: number
}

const cookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}

function key() {
  return crypto.createHash('sha256').update(getSessionSecret()).digest()
}

export function sealSession(session: AppSession) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), 'utf8'),
    cipher.final(),
  ])
  return [
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.')
}

export function unsealSession(value?: string): AppSession {
  if (!value) return {}
  try {
    const [iv, tag, data] = value.split('.')
    if (!iv || !tag || !data) return {}
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key(),
      Buffer.from(iv, 'base64url'),
    )
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ])
    return JSON.parse(decrypted.toString('utf8')) as AppSession
  } catch {
    return {}
  }
}

export function sessionCookie(session: AppSession): ResponseCookie {
  return {
    ...cookieOptions,
    name: SESSION_COOKIE,
    value: sealSession(session),
  }
}

export function expiredSessionCookie(): ResponseCookie {
  return {
    ...cookieOptions,
    maxAge: 0,
    name: SESSION_COOKIE,
    value: '',
  }
}
