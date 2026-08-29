import { notFound } from 'next/navigation';
import DormProfileView from '@/components/DormProfileView';
import dormsData from '@/data/dorms.json';
import { Dormitory } from '@/types/dormitory';
import type { Metadata } from 'next';

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

  return {
    title: `${dorm.name} (${dorm.zone}) | Dormie UBU`,
    description: `ข้อมูลราคา สิ่งอำนวยความสะดวก และผลประเมินหอพักสีขาวของ ${dorm.name} มหาวิทยาลัยอุบลราชธานี`,
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

  return <DormProfileView dorm={dorm} />;
}
