import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const geist = Geist({
  subsets: ["latin"],
  variable: '--font-geist',
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Student OS - Your Ultimate Study Companion',
  description: 'An all-in-one study tracker, deep work timer, planner, and productivity dashboard designed for ambitious students. Built thoughtfully by Jainam Karnawat.',
  generator: 'Student OS',
  manifest: '/manifest.json',
  keywords: ['study', 'productivity', 'focus', 'timer', 'planner', 'student', 'education', 'pomodoro', 'habits', 'analytics'],
  authors: [{ name: 'Jainam Karnawat', url: 'https://instagram.com/thats.jainam' }],
  creator: 'Jainam Karnawat',
  publisher: 'Student OS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Student OS',
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Student OS - Your Ultimate Study Companion',
    description: 'An all-in-one study tracker, deep work timer, planner, and productivity dashboard. Built thoughtfully by Jainam Karnawat.',
    siteName: 'Student OS',
    url: 'https://student-os.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student OS - Your Ultimate Study Companion',
    description: 'An all-in-one study tracker, deep work timer, planner, and productivity dashboard. Built thoughtfully by Jainam Karnawat.',
    creator: '@thats.jainam',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'productivity',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a14' },
    { media: '(prefers-color-scheme: amoled)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 3,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none';" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="HandheldFriendly" content="true" />
        <Script id="register-sw" strategy="afterInteractive">
{`if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js?v=8').then(function(reg) {
      // Auto-update: activate new SW immediately — controllerchange handles reload
      reg.addEventListener('updatefound', function() {
        var newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'skip-waiting' });
            }
          });
        }
      });
      // Daily update check
      if (reg.active) {
        setInterval(function() { reg.update(); }, 86400000);
      }
    }).catch(function() {});
  });
  // Listen for controller change (new SW took over)
  var refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
}`}
        </Script>
        <Script id="theme-hydration" strategy="beforeInteractive">
{`(function() {
  try {
    var keys = ['student-os-storage-v3', 'student-os-storage-v2'];
    for (var i = 0; i < keys.length; i++) {
      var raw = localStorage.getItem(keys[i]);
      if (!raw) continue;
      var parsed = JSON.parse(raw);
      var state = parsed.state || parsed;
      if (state && (state.theme === 'light' || state.theme === 'dark' || state.theme === 'amoled')) {
        var root = document.documentElement;
        root.classList.remove('light', 'dark', 'amoled');
        if (state.theme === 'dark' || state.theme === 'amoled') {
          root.classList.add('dark');
          if (state.theme === 'amoled') root.classList.add('amoled');
        }
        break;
      }
    }
  } catch(e) {}
})();`}
        </Script>
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
