import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ContentSignal — Editorial Intelligence Lab',
  description: 'A synthetic-data prototype for evidence-grounded editorial analysis, source change impact mapping, and model evaluation.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
