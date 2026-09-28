import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { SITE_URL, profile } from "@/content/profile";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const title = `${profile.name} | Retail space planning & analytics`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description: profile.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: profile.name,
    title,
    description: profile.description,
    firstName: "Brian",
    lastName: "Riffle",
  },
  twitter: { card: "summary_large_image", title, description: profile.description },
};

export const viewport: Viewport = {
  themeColor: "#f2f4f6",
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: SITE_URL,
  email: `mailto:${profile.email}`,
  jobTitle: profile.role,
  image: `${SITE_URL}/media/brian-portrait-800.jpg`,
  address: { "@type": "PostalAddress", addressLocality: "New Albany", addressRegion: "OH", addressCountry: "US" },
  sameAs: [profile.linkedin],
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Ohio University" },
    { "@type": "CollegeOrUniversity", name: "Washington & Jefferson College" },
  ],
  knowsAbout: [
    "Macro space planning",
    "Planogram development",
    "Category management",
    "Floor planning",
    "Retail analytics",
    "Blue Yonder",
    "Power BI",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </body>
    </html>
  );
}
