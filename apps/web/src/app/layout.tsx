import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Smartboard',
  description: 'Multi-tenant analytics and dashboard platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-scheme="mint" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
