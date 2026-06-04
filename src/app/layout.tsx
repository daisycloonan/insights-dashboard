import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/NavBar';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Beverage Intelligence Platform',
  description: 'Consumer & Brand Intelligence Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <NavBar />
        <main className="px-6 py-8 max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}