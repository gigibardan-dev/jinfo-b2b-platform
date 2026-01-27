'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  role?: 'admin' | 'agency' | null;
}

export default function Header({ role = null }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Admin navigation links
  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/bookings', label: 'Rezervări', icon: '📋' },
    { href: '/admin/payments', label: 'Plăți', icon: '💰' },
    { href: '/admin/agencies', label: 'Agenții', icon: '🏢' },
    { href: '/admin/create-agency', label: 'Creare Agenție', icon: '➕' },
  ];

  // Agency navigation links
  const agencyLinks = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/agency/bookings', label: 'Rezervările Mele', icon: '📋' },
    { href: '/agency/payments', label: 'Plăți', icon: '💰' },
    { href: '/agency/profile', label: 'Profil', icon: '👤' },
  ];

  const navLinks = role === 'admin' ? adminLinks : role === 'agency' ? agencyLinks : [];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="text-3xl font-bold transition-transform group-hover:scale-105">
              <span className="text-orange-500">J'INFO</span>
              <span className="text-blue-600"> B2B</span>
            </div>
            <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
              Portal Agenții
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <a 
              href="mailto:info@jinfotours.ro"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 transition-colors font-medium"
            >
              <span>📞</span>
              <span className="hidden sm:inline">Contact</span>
            </a>

            {loading ? (
              <div className="w-24 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                {!role && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-orange-500 transition-colors font-medium"
                  >
                    <span>👤</span>
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm hover:shadow-md"
                >
                  <span>🚪</span>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
                <span>🔐</span>
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Navigation menu - only show if role is provided */}
        {role && navLinks.length > 0 && (
          <nav className="border-t border-gray-100">
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                      ${isActive 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                      }
                    `}
                  >
                    <span className={isActive ? 'scale-110' : ''}>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}