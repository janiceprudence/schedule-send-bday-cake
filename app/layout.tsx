import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bailey's Cake Mail | Birthday Cake Studio",
  description: "Decorate a little birthday cake and schedule it to arrive by email.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
