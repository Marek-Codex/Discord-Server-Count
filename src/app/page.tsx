import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DiscordLogo } from '@/components/discord-logo'
import { InfoDialog } from '@/components/info-dialog'
import { SESSION_COOKIE, unsealSession } from '@/lib/session'

const errors: Record<string, string> = {
  auth: 'Discord could not complete the sign-in. Please try again.',
  config: 'Discord login is temporarily unavailable.',
  state: 'That sign-in expired. Please start again.',
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const cookieStore = await cookies()
  const session = unsealSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (session.accessToken) redirect('/dashboard')
  const { error } = await searchParams

  return (
    <main className="container">
      <div className="content">
        <DiscordLogo />
        <p className="node-label">Access node: Discord guild count</p>
        <h1>Discord Server Count</h1>
        <p className="subtitle">
          Link Discord. Count your servers. Leave the rest of the
          dashboard-industrial complex alone.
        </p>
        {error && errors[error] && (
          <p className="inline-error" role="alert">
            {errors[error]}
          </p>
        )}
        <a href="/login" className="btn btn-discord">
          Log into Discord
        </a>
        <InfoDialog />
      </div>
    </main>
  )
}
