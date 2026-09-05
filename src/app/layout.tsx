import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ubon-dorm-finder.vercel.app';

export const viewport: Viewport = {
  themeColor: '#0a1931',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Dormie UBU | รวมหอพักสีขาว ม.อุบลฯ 60 แห่ง พร้อมระบบ GPS นำทาง',
    template: '%s | Dormie UBU',
  },
  description: 'แอปพลิเคชันค้นหาหอพักรอบมหาวิทยาลัยอุบลราชธานี ตรวจสอบมาตรฐานหอพักสีขาวประจำปี 2569 เช็คราคา สิ่งอำนวยความสะดวก และระบบแผนที่นำทาง GPS แบบเรียลไทม์',
  keywords: [
    'หอพัก ม.อุบล',
    'หอพัก มหาวิทยาลัยอุบลราชธานี',
    'หอพักสีขาว ม.อุบล',
    'ค้นหาหอพัก อุบล',
    'หอพักใกล้ ม.อุบล',
    'Dormie UBU',
    'หอพักวารินชำราบ',
    'หอพัก มดแดง',
    'หอพักนักศึกษา ม.อุบล'
  ],
  authors: [{ name: 'มหาวิทยาลัยอุบลราชธานี (UBU)' }],
  creator: 'Dormie UBU Team',
  publisher: 'มหาวิทยาลัยอุบลราชธานี',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: '/',
    siteName: 'Dormie UBU - ค้นหาหอพัก ม.อุบลฯ',
    title: 'Dormie UBU | รวมหอพักสีขาว ม.อุบลฯ 60 แห่ง พร้อมระบบ GPS นำทาง',
    description: 'ค้นหาหอพักรอบ ม.อุบลฯ ตรวจสอบมาตรฐานหอพักสีขาว ราคา สิ่งอำนวยความสะดวก และระบบแผนที่นำทาง GPS',
    images: [
      {
        url: '/picture/cover.jpg?v=2',
        width: 1200,
        height: 630,
        alt: 'Dormie UBU แพลตฟอร์มค้นหาหอพัก มหาวิทยาลัยอุบลราชธานี',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dormie UBU | รวมหอพักสีขาว ม.อุบลฯ 60 แห่ง พร้อมระบบ GPS นำทาง',
    description: 'ค้นหาหอพักรอบ ม.อุบลฯ ตรวจสอบมาตรฐานหอพักสีขาว และระบบ GPS นำทาง',
    images: ['/picture/cover.jpg?v=2'],
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
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Dormie UBU',
  alternateName: 'ระบบค้นหาหอพัก มหาวิทยาลัยอุบลราชธานี',
  url: siteUrl,
  description: 'แอปพลิเคชันค้นหาหอพักรอบมหาวิทยาลัยอุบลราชธานี ตรวจสอบมาตรฐานหอพักสีขาว',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
