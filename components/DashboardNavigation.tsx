'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Users,
  CreditCard,
  BarChart3,
  LogOut,
  Menu,
  Store,
  Globe,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getMessages, type Locale, getLocaleFromString } from '@/lib/i18n';
import { type JWTPayload } from '@/lib/auth';
import { useLanguageContext } from './LanguageProvider';

interface DashboardNavigationProps {
  user: JWTPayload;
}

export default function DashboardNavigation({ user }: DashboardNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale, t } = useLanguageContext();
  const messages = getMessages(locale);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);

  };

  const navigationItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: messages.nav.dashboard,
      color: 'text-emerald-600',
    },
    {
      href: '/dashboard/products',
      icon: Package,
      label: messages.nav.products,
      color: 'text-blue-600',
    },
    {
      href: '/dashboard/customers',
      icon: Users,
      label: messages.nav.customers,
      color: 'text-purple-600',
    },
    {
      href: '/dashboard/sales',
      icon: ShoppingCart,
      label: messages.nav.sales,
      color: 'text-amber-600',
    },
    {
      href: '/dashboard/invoices',
      icon: FileText,
      label: messages.nav.invoices,
      color: 'text-teal-600',
    },
    {
      href: '/dashboard/purchases',
      icon: ShoppingBag,
      label: messages.nav.purchases,
      color: 'text-green-600',
    },
    {
      href: '/dashboard/returns',
      icon: RotateCcw,
      label: messages.nav.returns,
      color: 'text-red-600',
    },
    {
      href: '/dashboard/credit',
      icon: CreditCard,
      label: messages.nav.credit,
      color: 'text-orange-600',
    },
    {
      href: '/dashboard/analytics',
      icon: BarChart3,
      label: messages.nav.analytics,
      color: 'text-indigo-600',
    },
    {
      href: '/dashboard/settings',
      icon: FileText,
      label: messages.nav.settings,
      color: 'text-gray-600',
    }
  ];

  const NavContent = ({ isMobile = false }) => (
    <div className={`flex flex-col ${isMobile ? 'h-full' : 'h-screen'} bg-white border-r border-gray-200 backdrop-blur-xl bg-white/50`}>
      {/* Brand Header */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-xl blur-lg opacity-40 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-105">
              <Store className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-purple-600 font-dm-sans">
              Moul Hanout
            </h1>
            <p className="text-sm text-gray-500 font-inter tracking-wide">Gestion commerciale</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? () => setIsOpen(false) : undefined}
              className={`group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out
                ${isActive 
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700' 
                  : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                }`}
            >
              <IconComponent className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                isActive ? item.color : 'text-gray-400'
              }`} />
              <span className={`font-medium text-sm ${isActive ? 'text-emerald-900' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-4">
        {/* Language Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {messages.nav.language}
          </label>
          <Select value={locale} onValueChange={handleLocaleChange}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="ar">🇲🇦 العربية</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Info & Logout */}
        <div className="space-y-3">
          <div className="text-xs text-gray-500">
            <p className="font-medium text-gray-700">{user.email || user.phone}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            {messages.nav.logout}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:block w-64 fixed left-0 top-0 z-30">
        <NavContent />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-4 left-4 z-50 bg-white shadow-md border"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <NavContent isMobile />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
