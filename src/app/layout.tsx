import type { Metadata, Viewport } from 'next'
import { Exo_2, Kode_Mono } from 'next/font/google'
import { PlexusCanvas } from '@/components/plexus-canvas'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

const exo = Exo_2({ subsets: ['latin'], variable: '--font-exo' })
const kode = Kode_Mono({ subsets: ['latin'], variable: '--font-kode' })

export const metadata: Metadata = {
  title: 'Discord Server Count by MarekCodex',
  description:
    "Tiny Discord OAuth utility that counts how many servers you're in.",
  metadataBase: new URL('https://discord-server-count.vercel.app'),
  alternates: { canonical: '/' },
  authors: [{ name: 'MarekCodex' }],
  openGraph: {
    title: 'Discord Server Count',
    description: 'Link Discord. Count your servers. Wicked elaborate, I know.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discord Server Count',
    description: 'Link Discord. Count your servers. Wicked elaborate, I know.',
    images: ['/og-image.png'],
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/favicon-180x180.png',
  },
}

export const viewport: Viewport = { themeColor: '#3ca0ff' }

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${exo.variable} ${kode.variable}`}>
      <body>
        <PlexusCanvas />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
