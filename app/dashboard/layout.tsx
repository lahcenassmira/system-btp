import { requireAuth } from '@/lib/server-auth';
import DashboardNavigation from '@/components/DashboardNavigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth('/dashboard');

  return (
    <div className="flex min-h-screen bg-white">
      <DashboardNavigation user={user} />
      <div className="flex-1 lg:ml-64">
        {children}
      </div>
    </div>
  );
}
