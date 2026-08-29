import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://cyber-ciso-omnikon-22ru.vercel.app'),
  title: {
    default: 'CyberCISO - Virtual CISO for Small Business',
    template: '%s | CyberCISO',
  },
  description: 'On-demand cybersecurity assessment and 30-day remediation plan anchored to NIST CSF 2.0 and CIS Controls v8',
  keywords: ['cybersecurity', 'CISO', 'security assessment', 'NIST CSF', 'CIS Controls', 'small business', 'risk management', 'compliance'],
  authors: [{ name: 'CyberCISO' }],
  creator: 'CyberCISO',
  publisher: 'CyberCISO',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cyber-ciso-omnikon-22ru.vercel.app',
    siteName: 'CyberCISO',
    title: 'CyberCISO - Virtual CISO for Small Business',
    description: 'On-demand cybersecurity assessment and 30-day remediation plan anchored to NIST CSF 2.0 and CIS Controls v8',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CyberCISO - Virtual CISO Security Assessment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CyberCISO - Virtual CISO for Small Business',
    description: 'On-demand cybersecurity assessment and 30-day remediation plan anchored to NIST CSF 2.0 and CIS Controls v8',
    images: ['/images/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icon-192.png',
    other: [
      {
        rel: 'manifest',
        url: '/manifest.json',
      },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900">{children}</body>
    </html>
  );
}