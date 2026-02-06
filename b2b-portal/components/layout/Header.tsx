'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
   
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  // Navigation link type
  type NavLink = {
    href: string;
    label: string;
    icon: string;
    mobileLabel?: string;
  };

  // Admin navigation links
  const adminLinks: NavLink[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/bookings', label: 'Rezervări', icon: '📋' },
    { href: '/admin/payments', label: 'Plăți', icon: '💰' },
    { href: '/admin/agencies', label: 'Agenții', icon: '🏢' },
    { href: '/admin/create-agency', label: 'Creare Agenție', icon: '➕', mobileLabel: 'Creare' },
  ];

  // Agency navigation links
  const agencyLinks: NavLink[] = [
    { href: '/agency/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/agency/bookings', label: 'Rezervări', icon: '📋' },
    { href: '/agency/payments', label: 'Plăți', icon: '💰' },
    { href: '/agency/profile', label: 'Profil', icon: '👤' },
  ];

  const navLinks = role === 'admin' ? adminLinks : role === 'agency' ? agencyLinks : [];

  return (
    <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative w-32 h-10 sm:w-40 sm:h-12 transition-transform group-hover:scale-105">
              <Image
                src="/logo-jinfotours.svg"
                alt="J'Info Tours"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden sm:inline-flex px-2.5 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold rounded-full border-2 border-green-200 shadow-sm">
              Portal Agenții
            </span>
          </Link>
         
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="mailto:info@jinfotours.ro"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors font-medium rounded-lg hover:bg-gray-50"
            >
              <span className="text-lg">📧</span>
              <span>Contact</span>
            </a>

            {loading ? (
              <div className="w-24 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-2">
                {!role && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-orange-500 transition-colors font-semibold rounded-lg hover:bg-gray-50"
                  >
                    <span>👤</span>
                    <span>Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm shadow-sm"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-md hover:shadow-lg text-sm"
              >
                <span>🔐</span>
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <span className="text-xl">✕</span>
            ) : (
              <span className="text-xl">☰</span>
            )}
          </button>
        </div>

        {/* Desktop Navigation - only show if role is provided */}
        {role && navLinks.length > 0 && (
          <nav className="hidden md:block border-t border-gray-100">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                      ${isActive
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-orange-500'
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-2">
            {/* Mobile Navigation Links */}
            {role && navLinks.length > 0 && (
              <div className="space-y-1 pb-3 border-b border-gray-200">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all
                        ${isActive
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                          : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                        }
                      `}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span>{link.mobileLabel || link.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Mobile Actions */}
            <div className="space-y-2 pt-2">
              <a
                href="mailto:info@jinfotours.ro"
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">📧</span>
                <span>Contact: info@jinfotours.ro</span>
              </a>

              {loading ? (
                <div className="w-full h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              ) : user ? (
                <div className="space-y-2">
                  {!role && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 font-semibold rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-xl">👤</span>
                      <span>Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold text-sm"
                  >
                    <span className="text-xl">🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-md text-sm"
                >
                  <span className="text-xl">🔐</span>
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}