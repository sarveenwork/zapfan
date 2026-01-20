import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZapFan",
  description: "Multi-tenant Point of Sale System",
  manifest: "/manifest.json",
  themeColor: "#FF6F3C",
  icons: {
    icon: "/assets/ZF-logo.png",
    apple: "/assets/ZF-logo.png",
  },
  openGraph: {
    title: "ZapFan",
    description: "Multi-tenant Point of Sale System",
    images: ["/assets/ZF-logo.png"],
  },
  twitter: {
    card: "summary",
    images: ["/assets/ZF-logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZapFan",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
