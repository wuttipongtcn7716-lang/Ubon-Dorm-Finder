import { notFound } from 'next/navigation';
import DormProfileView from '@/components/DormProfileView';
import dormsData from '@/data/dorms.json';
import { Dormitory } from '@/types/dormitory';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ubon-dorm-finder.vercel.app';

// Pre-render all 60 dorm detail pages at build time for 0ms client navigation speed
export async function generateStaticParams() {
  return (dormsData as Dormitory[]).map((dorm) => ({
    id: dorm.id.toString(),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = parseInt(params.id, 10);
  const dorm = (dormsData as Dormitory[]).find((d) => d.id === id);

  if (!dorm) {
    return {
      title: 'ไม่พบหอพัก | Dormie UBU',
    };
  }

  const priceText = dorm.minPrice
    ? `ราคาเริ่มต้น ฿${dorm.minPrice.toLocaleString()} /เดือน`
    : 'ติดต่อสอบถามราคา';
  const whiteStatusText = dorm.isWhiteDorm || dorm.status === 'ผ่าน'
    ? 'มาตรฐานหอพักสีขาว ม.อุบลฯ'
    : 'เครือข่ายหอพัก ม.อุบลฯ';
  const pageTitle = `${dorm.name} (${dorm.zone || 'รอบ ม.อุบลฯ'})`;
  const pageDesc = `ข้อมูลหอพัก ${dorm.name} โซน ${dorm.zone || 'ม.อุบลฯ'} ${priceText} ${whiteStatusText} ${dorm.phone ? `โทร: ${dorm.phone}` : ''} พร้อมระบบ GPS นำทาง`;
  
  const rawImage = (dorm.images && dorm.images[0]) || dorm.image || '/Picture/default-dorm.jpg';
  const imageUrl = rawImage.startsWith('http') ? rawImage : `${baseUrl}${encodeURI(rawImage)}`;

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `/dorm/${dorm.id}`,
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `/dorm/${dorm.id}`,
      siteName: 'Dormie UBU - ค้นหาหอพัก ม.อุบลฯ',
      locale: 'th_TH',
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: dorm.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
      images: [imageUrl],
    },
  };
}

export default function DormDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id, 10);
  const dorm = (dormsData as Dormitory[]).find((d) => d.id === id);

  if (!dorm) {
    notFound();
  }

  const rawImage = (dorm.images && dorm.images[0]) || dorm.image || '/Picture/default-dorm.jpg';
  const imageUrl = rawImage.startsWith('http') ? rawImage : `${baseUrl}${encodeURI(rawImage)}`;

  const amenities = [
    dorm.wifi ? { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi ฟรี', value: true } : null,
    dorm.parking ? { '@type': 'LocationFeatureSpecification', name: 'ที่จอดรถ', value: true } : null,
    dorm.cctv ? { '@type': 'LocationFeatureSpecification', name: 'กล้องวงจรปิด CCTV', value: true } : null,
    dorm.keycard ? { '@type': 'LocationFeatureSpecification', name: 'ประตูคีย์การ์ด', value: true } : null,
    dorm.securityGuard ? { '@type': 'LocationFeatureSpecification', name: 'รปภ. ดูแลความปลอดภัย', value: true } : null,
    dorm.roomType?.includes('แอร์') || (typeof dorm.price === 'object' && dorm.price !== null && dorm.price.air !== null)
      ? { '@type': 'LocationFeatureSpecification', name: 'เครื่องปรับอากาศ (แอร์)', value: true }
      : null,
    dorm.roomType?.includes('พัดลม') || (typeof dorm.price === 'object' && dorm.price !== null && dorm.price.fan !== null)
      ? { '@type': 'LocationFeatureSpecification', name: 'พัดลม', value: true }
      : null,
    dorm.waterHeater ? { '@type': 'LocationFeatureSpecification', name: 'เครื่องทำน้ำอุ่น', value: true } : null,
    dorm.fridge ? { '@type': 'LocationFeatureSpecification', name: 'ตู้เย็น', value: true } : null,
    dorm.washingMachine ? { '@type': 'LocationFeatureSpecification', name: 'เครื่องซักผ้าหยอดเหรียญ', value: true } : null,
  ].filter(Boolean);

  const dormJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    '@id': `${baseUrl}/dorm/${dorm.id}#apartment`,
    name: dorm.name,
    description: `หอพัก ${dorm.name} โซน ${dorm.zone || 'รอบมหาวิทยาลัยอุบลราชธานี'} ${
      dorm.minPrice ? `ราคาเริ่มต้น ฿${dorm.minPrice.toLocaleString()} /เดือน` : ''
    } ${dorm.isWhiteDorm ? 'ผ่านการประเมินมาตรฐานหอพักสีขาว ม.อุบลฯ' : ''}`,
    url: `${baseUrl}/dorm/${dorm.id}`,
    image: imageUrl,
    telephone: dorm.phone || undefined,
    priceRange: dorm.minPrice
      ? `฿${dorm.minPrice} - ฿${dorm.maxPrice || dorm.minPrice}`
      : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: dorm.zone || 'รอบมหาวิทยาลัยอุบลราชธานี',
      addressLocality: 'ตำบลเมืองศรีไค',
      addressRegion: 'อำเภอวารินชำราบ จังหวัดอุบลราชธานี',
      postalCode: '34190',
      addressCountry: 'TH',
    },
    ...(dorm.lat && dorm.lng
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: dorm.lat,
            longitude: dorm.lng,
          },
        }
      : {}),
    amenityFeature: amenities,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dormJsonLd) }}
      />
      <DormProfileView dorm={dorm} />
    </>
  );
}
