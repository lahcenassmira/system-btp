import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from '@/components/LanguageProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM الحانوت - نظام إدارة المحلات التجارية المغربية",
  description: "نظام إدارة مبسط ومجاني للمحلات التجارية المغربية. إدارة الزبائن، تتبع المبيعات، والديون بكل سهولة. Système de gestion gratuit pour commerces marocains.",
  keywords: "CRM, Morocco, Hanout, Commerce, Gestion, Clients, Ventes, Maroc, حانوت, إدارة, زبائن, مبيعات",
  authors: [{ name: "CRM الحانوت Team" }],
  openGraph: {
    title: "CRM الحانوت - نظام إدارة المحلات التجارية المغربية",
    description: "نظام إدارة مبسط ومجاني للمحلات التجارية المغربية",
    type: "website",
    locale: "ar_MA",
    alternateLocale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CRM الحانوت - نظام إدارة المحلات التجارية المغربية",
    description: "نظام إدارة مبسط ومجاني للمحلات التجارية المغربية",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" dir="ltr">
      <body className={`${inter.className} antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Toaster 
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            },
          }}
        />
      </body>
    </html>
  );
}