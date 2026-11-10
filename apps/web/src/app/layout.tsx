import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getConfig } from '@/lib/content'
import './globals.css'

export function generateMetadata(): Metadata {
  const { site } = getConfig()
  return {
    metadataBase: new URL(site.url),
    title: {
      default: site.title,
      template: `%s · ${site.title}`,
    },
    description: site.description,
    authors: site.author ? [{ name: site.author }] : undefined,
    openGraph: {
      type: 'website',
      title: site.title,
      description: site.description,
      siteName: site.title,
    },
    icons: {
      icon: '/favicon.svg',
    },
  }
}

function csp(): string {
  const dev = process.env.NODE_ENV === 'development'
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com" + (dev ? ' ws: http://localhost:*' : ''),
    "worker-src 'self' blob:",
    "frame-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const { site } = getConfig()
  return (
    <html lang={site.locale}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp()} />
        <meta name="color-scheme" content="light" />
        <style>{`:root{--color-accent:${site.theme.accent};--radius:${site.theme.radius};--color-accent-soft:${site.theme.accent}14;}`}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
