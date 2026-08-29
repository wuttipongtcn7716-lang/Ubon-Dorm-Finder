import DormExplorer from '@/components/DormExplorer';
import WelcomeScreen from '@/components/WelcomeScreen';
import dormsData from '@/data/dorms.json';
import { Dormitory } from '@/types/dormitory';

export default function HomePage() {
  const dorms = dormsData as Dormitory[];

  return (
    <main className="min-h-screen pb-16 bg-[#f8fafc]">
      <WelcomeScreen />
      <DormExplorer initialDorms={dorms} />
    </main>
  );
}
