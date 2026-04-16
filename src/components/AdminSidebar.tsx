"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const LINKS = [
  { href: "/admin", label: "Resumen", icon: "📊" },
  { href: "/admin/citas", label: "Citas", icon: "📅" },
  { href: "/admin/pagos", label: "Pagos", icon: "💳" },
  { href: "/admin/cupones", label: "Cupones", icon: "🎟" },
  { href: "/admin/servicios", label: "Servicios", icon: "✨" },
  { href: "/admin/disponibilidad", label: "Disponibilidad", icon: "🕒" },
  { href: "/admin/galeria", label: "Galería", icon: "🖼" },
  { href: "/admin/usuarios", label: "Clientas", icon: "👥" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-64 bg-emerald-800 text-white flex flex-col">
      <div className="px-5 py-5 border-b border-emerald-700">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="AURA" width={36} height={36} className="rounded-full border border-gold-300/50" />
          <div>
            <span className="block text-base font-display font-bold">AURA</span>
            <span className="block text-[9px] text-gold-300 tracking-wider">PANEL ADMIN</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {LINKS.map((l) => {
          const active = pathname === l.href || (l.href !== "/admin" && pathname?.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? "bg-emerald-700 text-gold-300" : "text-emerald-100 hover:bg-emerald-700/50"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}

        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-300 hover:bg-emerald-700/50 mt-4">
          <span>↩</span> Vista cliente
        </Link>
      </nav>

      <div className="p-3 border-t border-emerald-700">
        <div className="px-2 py-2 text-xs text-emerald-200 truncate">{profile?.email}</div>
        <button onClick={signOut} className="w-full px-3 py-2 text-xs text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-lg transition">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
