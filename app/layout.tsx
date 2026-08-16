import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finora — Personal finance, made simple",
  description: "Track spending, build budgets, and reach savings goals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
