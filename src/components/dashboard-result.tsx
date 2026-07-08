'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

type Account = {
  authenticated: true
  guildCount: number
  user: { avatar: string | null; id: string; username: string }
}
type State =
  | { status: 'loading' }
  | { status: 'ready'; account: Account }
  | { status: 'error' }

export function DashboardResult() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/user', { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign('/')
          return null
        }
        if (!response.ok) throw new Error('Account unavailable')
        return response.json() as Promise<Account>
      })
      .then((account) => {
        if (account) setState({ status: 'ready', account })
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setState({ status: 'error' })
        }
      })
    return () => controller.abort()
  }, [])

  if (state.status === 'loading') {
    return (
      <>
        <p className="count" aria-live="polite">
          <span className="count-number">--</span>
          <span>servers</span>
        </p>
        <div className="user-card skeleton" aria-label="Loading your account" />
      </>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="result-error" role="alert">
        <strong>Discord did not answer cleanly.</strong>
        <span>Try signing in again in a moment.</span>
      </div>
    )
  }

  const { user, guildCount } = state.account
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : null
  return (
    <>
      <p className="count" aria-live="polite">
        <span className="count-number">{guildCount.toLocaleString()}</span>
        <span>servers</span>
      </p>
      <div className="user-card">
        {avatar && (
          <Image
            className="avatar"
            src={avatar}
            width={52}
            height={52}
            alt={`${user.username}'s avatar`}
            unoptimized
          />
        )}
        <div>
          <p className="label">Signed in as</p>
          <p>
            <strong>{user.username}</strong>
          </p>
          <p className="user-id">
            ID: <code>{user.id}</code>
          </p>
        </div>
      </div>
    </>
  )
}
