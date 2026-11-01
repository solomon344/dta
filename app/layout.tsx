import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { OPEN_GRAPH_BASE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Only these Material Symbols glyphs are downloaded. Keep alphabetical (Google Fonts requires it).
const ICON_NAMES = [
  "add",
  "arrow_back",
  "arrow_forward",
  "badge",
  "block",
  "calendar_month",
  "check_circle",
  "checklist",
  "close",
  "code_blocks",
  "content_copy",
  "dashboard",
  "delete",
  "description",
  "download",
  "edit",
  "error",
  "flag",
  "group",
  "groups",
  "image",
  "info",
  "lock",
  "logout",
  "mail",
  "menu",
  "menu_book",
  "open_in_new",
  "person",
  "person_add",
  "print",
  "progress_activity",
  "public",
  "query_stats",
  "school",
  "search",
  "share",
  "terminal",
  "trending_up",
  "upload",
  "upload_file",
  "verified",
  "verified_user",
  "visibility",
  "volunteer_activism",
  "workspace_premium",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Data Technology Academy (DTA) | Software & Data Training in The Gambia",
    template: "%s | Data Technology Academy",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Data Technology Academy",
    "DTA",
    "DTA Gambia",
    "The Gambia",
    "Gambia tech training",
    "software development course",
    "data analytics course",
    "Power BI",
    "Python",
    "certificate verification",
    "verify certificate",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  alternates: { canonical: "/" },
  openGraph: {
    ...OPEN_GRAPH_BASE,
    url: "/",
    title: "Data Technology Academy (DTA) | The Gambia",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Data Technology Academy (DTA) | The Gambia",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0d1c32",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${jakarta.variable} antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${ICON_NAMES.join(",")}&display=block`}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface text-body-md text-on-surface">
        {children}
      </body>
    </html>
  );
}
