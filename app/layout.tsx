import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LanguageProvider } from '@/components/LanguageProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tijara CRM — Gestion BTP Maroc",
  description: "Système de gestion premium pour entreprises BTP marocaines. Devis, chantiers, stock et flux financiers. Simple, moderne et efficace.",
  keywords: "CRM, BTP, Maroc, Gestion, Devis, Chantier, Stock, Tijara, Construction, Morocco",
  authors: [{ name: "Tijara CRM" }],
  openGraph: {
    title: "Tijara CRM — Gestion BTP Maroc",
    description: "Système de gestion premium pour entreprises BTP marocaines",
    type: "website",
    locale: "fr_FR",
    alternateLocale: "ar_MA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tijara CRM — Gestion BTP Maroc",
    description: "Système de gestion premium pour entreprises BTP marocaines",
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