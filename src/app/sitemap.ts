import { MetadataRoute } from 'next';
import dormsData from '@/data/dorms.json';
import { Dormitory } from '@/types/dormitory';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ubon-dorm-finder.vercel.app';
  const currentDate = new Date().toISOString();

  // Root Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // All 60 Dormitory detail routes
  (dormsData as Dormitory[]).forEach((dorm) => {
    routes.push({
      url: `${baseUrl}/dorm/${dorm.id}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return routes;
}
