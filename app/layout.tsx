import "./globals.css";
import Navbar from "./Navbar";
import Footer from "../components/home/footer";
import type { Metadata } from "next";
import type { ReactNode } from "react";


export const metadata: Metadata = {
  title: "Softbade",
  description: "AI & SaaS Tools Directory",
  icons: {
    icon: [{ url: "/softbade-navbar-logo.png", type: "image/png" }],
    shortcut: [{ url: "/softbade-navbar-logo.png", type: "image/png" }],
    apple: [{ url: "/softbade-navbar-logo.png", type: "image/png" }],
  },
  openGraph: {
    title: "Softbade",
    description: "AI & SaaS Tools Directory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Softbade",
    description: "AI & SaaS Tools Directory",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#000", color: "#fff" }}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
  
}
