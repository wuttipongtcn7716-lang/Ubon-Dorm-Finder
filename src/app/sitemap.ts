import { MetadataRoute } from 'next';
import dormsData from '@/data/dorms.json';
import { Dormitory } from '@/types/dormitory';
import { parseThaiDateToIso } from '@/utils/dateUtils';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ubon-dorm-finder.vercel.app';
  const dorms = dormsData as Dormitory[];

  // หาค่าวันที่ตรวจประเมินล่าสุดจากข้อมูลจริงทั้งหมดเพื่อใช้กับหน้าแรก (Homepage)
  let latestAuditDate = '2026-05-07T00:00:00+07:00';
  dorms.forEach((d) => {
    const iso = parseThaiDateToIso(d.evaluationDate || d.evalDate);
    if (iso && iso > latestAuditDate) {
      latestAuditDate = iso;
    }
  });

  // Root Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestAuditDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // All 60 Dormitory detail routes with real evaluation lastModified date
  dorms.forEach((dorm) => {
    const dormLastModified = parseThaiDateToIso(dorm.evaluationDate || dorm.evalDate) || latestAuditDate;
    routes.push({
      url: `${baseUrl}/dorm/${dorm.id}`,
      lastModified: dormLastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return routes;
}
