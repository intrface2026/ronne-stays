import type { Metadata } from 'next';
import { Playfair_Display, Outfit } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ronne Stays — Luxury Goa Rentals',
  description:
    'Stay in North Goa with Ronne Stays — studios, 1BHK & 2BHK apartments in Arpora and 3BHK villas in Sangolda, Nagoa-Bardez, and Verla.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable}`}>
      <body className="antialiased bg-white text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
