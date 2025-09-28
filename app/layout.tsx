// app/layout.tsx
import "./globals.css"
import { Poppins } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import Layout from "@/components/layout"
import ClientHydrationFix from "@/components/client-hydration-fix"


const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata = {
  title: "Network Monitor",
  description: "Monitor your network devices, map, alerts, and logs",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.className} min-h-screen bg-background text-foreground`}>
        <ClientHydrationFix />
        <Layout>
          {children}
        </Layout>
        <Toaster />
      </body>
    </html>
  )
}
