import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardResult } from '@/components/dashboard-result'
import { DiscordLogo } from '@/components/discord-logo'
import { SESSION_COOKIE, unsealSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Your count · Discord Server Count',
  robots: { index: false, follow: false },
}

export default async function Dashboard() {
  const cookieStore = await cookies()
  const session = unsealSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!session.accessToken) redirect('/')

  return (
    <main className="container">
      <div className="content">
        <DiscordLogo />
        <p className="node-label">Access node: resolved</p>
        <h1>Discord Server Count</h1>
        <p className="subtitle">You are in</p>
        <DashboardResult />
        <a href="/logout" className="btn btn-secondary">
          Log out
        </a>
      </div>
    </main>
  )
}
