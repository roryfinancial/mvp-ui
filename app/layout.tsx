import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rory — Fan Gifts. Low Fees.",
  description: "Rory lets creators set goals for their projects and fans donate to help achieve them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
