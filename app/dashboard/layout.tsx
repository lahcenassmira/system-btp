import { requireAuth } from '@/lib/server-auth';
import DashboardNavigation from '@/components/DashboardNavigation';
import DashboardLayoutClient from '@/components/DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth('/dashboard');

  return (
    <div className="flex min-h-screen bg-[#f6f5f4]">
      <DashboardNavigation user={user} />
      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </div>
  );
}
