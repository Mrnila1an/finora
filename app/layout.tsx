import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://finora-yykm-five.vercel.app"),
  verification: {
    google: "SfyY0x92z7r5ebes04165l1vDB61njpwfObqIdjq0JQ",
  },
  title: {
    default: "Finora — Personal finance, made simple",
    template: "%s | Finora",
  },
  description: "Finora helps you track spending, build budgets, and reach savings goals.",
  keywords: ["Finora", "personal finance", "budget tracker", "expense tracker", "savings goals"],
  openGraph: {
    title: "Finora — Personal finance, made simple",
    description: "Track spending, build budgets, and reach savings goals.",
    url: "https://finora-yykm-five.vercel.app",
    siteName: "Finora",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
