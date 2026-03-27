import './globals.css'
import type {Metadata, Viewport} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import {ThemeProvider} from '@/components/custom/themeProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
}

export const viewport: Viewport = {
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#ffffff'},
    {media: '(prefers-color-scheme: dark)', color: '#141820'},
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          themes={['light', 'dark', 'high-contrast']}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
