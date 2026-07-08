'use client'

import { useEffect, useState } from 'react'

type Stats = { countsGenerated: number; durable: boolean }

export function SiteFooter() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/stats', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Stats unavailable')
        return response.json() as Promise<Stats>
      })
      .then(setStats)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <footer className="site-footer">
      <p className="usage-line">
        Counts generated:{' '}
        <span title={stats?.durable ? 'Stored in Redis' : undefined}>
          {stats ? stats.countsGenerated.toLocaleString() : '--'}
        </span>
      </p>
      <p>
        Created by{' '}
        <a href="https://www.twitch.tv/MarekCodex">MarekCodex</a>
        {' · '}
        <a href="https://github.com/Marek-Codex/Discord-Server-Count">
          Source on GitHub
        </a>
        {' · '}
        <a href="https://ko-fi.com/MarekCodex">Ko-fi</a>
      </p>
      <p className="footer-copy">
        Tiny tools still need fuel. Code, caffeine, spite toward unnecessary
        dashboards, the usual.
      </p>
    </footer>
  )
}
