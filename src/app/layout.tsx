import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// @pixi/events 패키지를 import하여 이벤트 시스템 활성화
import '@pixi/events'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IRKE TOWN - Build Your App Like a Game',
  description: 'Transform web app development into a town building game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        {children}
      </body>
    </html>
  )
}