'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/overview', label: 'Overview' },
  { href: '/consumer-voice', label: 'Consumer Voice' },
  { href: '/products', label: 'Products' },
  { href: '/brands', label: 'Brands' },
  { href: '/opportunities', label: 'Opportunities' },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-8 sticky top-0 z-50">
      <span className="text-lg font-bold text-emerald-400 tracking-tight whitespace-nowrap">
        🥤 BevIntel
      </span>
      <div className="flex gap-6">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors ${
              pathname.startsWith(link.href)
                ? 'text-white border-b-2 border-emerald-400 pb-0.5'
                : 'text-gray-400 hover:text-emerald-400'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}