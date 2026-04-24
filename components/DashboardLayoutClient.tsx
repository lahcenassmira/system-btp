'use client';

import { useEffect, useState } from 'react';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Load initial state
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }

    // Listen for changes
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebar-collapsed');
      setIsCollapsed(saved === 'true');
    };

    // Custom event for same-tab changes
    window.addEventListener('sidebar-toggle', handleStorageChange);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleStorageChange);
    };
  }, []);

  return (
    <div 
      className={`flex-1 transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}
    >
      {children}
    </div>
  );
}
