import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'أ. مصطفى كريم - منصة الرياضيات التعليمية',
  description: 'منصة تعليمية متخصصة في الرياضيات للأستاذ مصطفى كريم',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#07101e', color: '#e8edf8', fontFamily: 'Cairo, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
