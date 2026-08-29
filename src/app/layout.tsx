import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Dormie UBU | รวมหอพักสีขาว ม.อุบลฯ ไว้ที่เดียว',
  description: 'Dormie UBU แอปค้นหาหอพักรอบ ม.อุบลราชธานี ตรวจสอบมาตรฐานหอพักสีขาว สิ่งอำนวยความสะดวก พร้อมระบบ GPS นำทาง',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
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
      </head>
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
