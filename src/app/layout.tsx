import type { Metadata } from 'next';
import { Inter, Courier_Prime } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const courierPrime = Courier_Prime({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'OpenClaw — Your AI Agent Team',
  description: 'Chat with your 7-agent AI team.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${courierPrime.variable} antialiased`}>{children}</body>
    </html>
  );
}
