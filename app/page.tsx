import Hero from '@/components/Hero';
import Properties from '@/components/Properties';
import ComparisonChart from '@/components/ComparisonChart';
import Features from '@/components/Features';
import GuestReviews from '@/components/GuestReviews';
import Footer from '@/components/Footer';
import { Suspense } from 'react';

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <Hero />
      </Suspense>
      <Suspense fallback={null}>
        <Properties />
      </Suspense>
      <ComparisonChart />
      <Features />
      <GuestReviews />
      <Footer />
    </>
  );
}
