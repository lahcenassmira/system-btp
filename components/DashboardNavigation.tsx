'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Globe,
  RotateCcw,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
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
import { getMessages, type Locale } from '@/lib/i18n';
import { type JWTPayload } from '@/lib/auth';
import { useLanguageContext } from './LanguageProvider';

interface DashboardNavigationProps {
  user: JWTPayload;
}

export default function DashboardNavigation({ user }: DashboardNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { locale, setLocale } = useLanguageContext();
  const messages = getMessages(locale);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    // Dispatch custom event for layout to listen
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

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
      color: 'text-[#0075de]',
    },
    {
      href: '/dashboard/products',
      icon: Package,
      label: messages.nav.products,
      color: 'text-[#2a9d99]',
    },
    {
      href: '/dashboard/customers',
      icon: Users,
      label: messages.nav.customers,
      color: 'text-[#391c57]',
    },
    // Only show employees to owners
    ...(user.role === 'owner' ? [{
      href: '/dashboard/employees',
      icon: Users,
      label: messages.nav.employees || 'Employees',
      color: 'text-[#213183]',
    }] : []),
    {
      href: '/dashboard/sales',
      icon: ShoppingCart,
      label: messages.nav.sales,
      color: 'text-[#1aae39]',
    },
    {
      href: '/dashboard/invoices',
      icon: FileText,
      label: messages.nav.invoices,
      color: 'text-[#0075de]',
    },
    {
      href: '/dashboard/devis',
      icon: ClipboardList,
      label: 'Devis',
      color: 'text-[#ff64c8]',
    },
    {
      href: '/dashboard/purchases',
      icon: ShoppingBag,
      label: messages.nav.purchases,
      color: 'text-[#523410]',
    },
    {
      href: '/dashboard/returns',
      icon: RotateCcw,
      label: messages.nav.returns,
      color: 'text-[#dd5b00]',
    },
    {
      href: '/dashboard/credit',
      icon: CreditCard,
      label: messages.nav.credit,
      color: 'text-[#dd5b00]',
    },
    {
      href: '/dashboard/analytics',
      icon: BarChart3,
      label: messages.nav.analytics,
      color: 'text-[#213183]',
    },
    {
      href: '/dashboard/settings',
      icon: FileText,
      label: messages.nav.settings,
      color: 'text-[#615d59]',
    }
  ];

  const NavContent = ({ isMobile = false }) => (
    <div className={`flex flex-col ${isMobile ? 'h-full' : 'h-screen'}  transition-all duration-300`}>
      {/* Brand Header */}
      <div className={`p-4 ${isCollapsed && !isMobile ? 'md:p-2' : 'md:p-6'} transition-all border-b border-gray-200 duration-300`}>
        <div className={`flex items-center ${isCollapsed && !isMobile ? 'justify-center' : 'gap-3 md:gap-4'}`}>
          <div className="relative flex-shrink-0">
            <Image
              src="/logo-tijara.png"
              alt="Tijara CRM Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-[#0075de] truncate">
                Tijara CRM
              </h1>
              <p className="text-xs md:text-sm text-[#a39e98] tracking-wide truncate">BTP Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? () => setIsOpen(false) : undefined}
              className={`group flex items-center ${isCollapsed && !isMobile ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-lg transition-all duration-150
                ${isActive
                  ? 'bg-[#f2f9ff] text-[#0075de] border-l-[3px] border-[#0075de] font-semibold'
                  : 'hover:bg-[#f6f5f4] text-[#615d59] hover:text-[rgba(0,0,0,0.95)]'
                }`}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              <IconComponent className={`w-[18px] h-[18px] ${isCollapsed && !isMobile ? '' : 'mr-3'} transition-transform group-hover:scale-105 ${
                isActive ? item.color : 'text-[#a39e98]'
              }`} />
              {(!isCollapsed || isMobile) && (
                <>
                  <span className={`text-caption ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0075de]"></div>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-4 space-y-4  ${isCollapsed && !isMobile ? 'items-center' : ''}`}>
        {/* Language Selector */}
        {(!isCollapsed || isMobile) && (
          <div className="space-y-2">
            <label className="text-badge-text font-medium text-[#a39e98] flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {messages.nav.language}
            </label>
            <Select value={locale} onValueChange={handleLocaleChange}>
              <SelectTrigger className="h-9 text-sm border-[#a39e98]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="ar">🇲🇦 العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isCollapsed && !isMobile && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const locales: Locale[] = ['fr', 'en', 'ar'];
                const currentIndex = locales.indexOf(locale);
                const nextLocale = locales[(currentIndex + 1) % locales.length];
                handleLocaleChange(nextLocale);
              }}
              className="w-10 h-10 p-0"
              title={messages.nav.language}
            >
              <Globe className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* User Info & Logout */}
        <div className="space-y-3">
          {(!isCollapsed || isMobile) && (
            <div className="text-badge-text text-[#a39e98]">
              <p className="font-medium text-[#615d59] truncate">{user.email || user.phone}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className={`${isCollapsed && !isMobile ? 'w-10 h-10 p-0' : 'w-full justify-start'} gap-2 text-[#dd5b00] hover:text-[#c45000] hover:bg-[#fff0e6]`}
            title={isCollapsed && !isMobile ? messages.nav.logout : undefined}
          >
            <LogOut className="w-4 h-4" />
            {(!isCollapsed || isMobile) && messages.nav.logout}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <div className={`hidden lg:block fixed left-0 top-0 z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <NavContent />
        
        {/* Collapse Toggle Button */}
        <Button
          onClick={toggleCollapse}
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-6 z-40 w-6 h-6 p-0 rounded-full bg-white hover:bg-[#f6f5f4]"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-[#615d59]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#615d59]" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="fixed top-4 left-4 z-50 bg-white"
            >
              <Menu className="w-5 h-5 text-[#615d59]" />
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
