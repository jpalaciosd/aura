import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA — Bienestar Estético | Maderoterapia, Masajes, Inyectología",
  description: "Transforma tu cuerpo y bienestar con nuestros servicios de maderoterapia, masajes reductores y relajantes, mesoterapia, inyectología y más. Agenda tu cita hoy.",
  icons: { icon: "/logo.jpg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased font-body selection:bg-primary-amber selection:text-on-primary-amber">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
