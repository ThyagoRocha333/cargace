import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CargaCE — sua energia, seus gastos, seu controle",
    template: "%s | CargaCE",
  },
  description:
    "Organize recargas, acompanhe custos da mobilidade elétrica e encontre eletropostos reais em Fortaleza.",
  applicationName: "CargaCE",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#16a34a" };

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
