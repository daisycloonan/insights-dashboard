import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Beverage Intelligence Platform',
  description: 'Consumer & Brand Intelligence Dashboard',
};

const navLinks = [
  { href: '/overview', label: 'Overview' },
  { href: '/consumer-voice', label: 'Consumer Voice' },
  { href: '/products', label: 'Products' },
  { href: '/brands', label: 'Brands' },
  { href: '/opportunities', label: 'Opportunities' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-8 sticky top-0 z-50">
          <span className="text-lg font-bold text-emerald-400 tracking-tight whitespace-nowrap">
            🥤 BevIntel
          </span>
          <div className="flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="px-6 py-8 max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}