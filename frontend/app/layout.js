import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/app/providers";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "SwipeTunes — Discover Music You'll Love",
  description: "Swipe through personalized music recommendations powered by Spotify. Like, discover, and connect with other music lovers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-[#050505] text-white`} style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        {/* Ambient Orbs */}
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />

        {/* Global Noise Texture */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              fontFamily: 'var(--font-inter), Inter, sans-serif',
              fontWeight: '600',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#1DB954', secondary: '#000' },
            },
          }}
        />

        <Providers>
          <div className="flex min-h-screen relative sidebar-gradient-border">
            <Sidebar />
            <main className="flex-1 ml-64 relative z-10 min-h-screen">
              <div className="max-w-4xl mx-auto px-8 py-12">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
