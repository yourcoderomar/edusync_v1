import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { PageTransitionLoader } from "@/components/common/PageTransitionLoader";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EduSync - Educational Management Platform",
    template: "%s | EduSync",
  },
  description: "Educational management platform with role-based access for admins and students. Manage classes, attendance, quizzes, and more.",
  keywords: ["education", "learning", "class management", "attendance", "quizzes", "LMS"],
  authors: [{ name: "EduSync" }],
  creator: "EduSync",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: "EduSync - Educational Management Platform",
    description: "Educational management platform with role-based access for admins and students.",
    siteName: "EduSync",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduSync - Educational Management Platform",
    description: "Educational management platform with role-based access for admins and students.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-white">
        <PageTransitionLoader />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
