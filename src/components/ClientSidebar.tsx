"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const LINKS = [
  { href: "/dashboard", label: "Resumen", icon: "🏡" },
  { href: "/dashboard/agendar", label: "Agendar", icon: "📅" },
  { href: "/dashboard/citas", label: "Mis citas", icon: "🗂" },
  { href: "/dashboard/perfil", label: "Perfil", icon: "👤" },
];

export default function ClientSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-cream-300 flex flex-col">
      <div className="px-5 py-5 border-b border-cream-200">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="AURA" width={36} height={36} className="rounded-full" />
          <div>
            <span className="block text-base font-display font-bold text-emerald-700">AURA</span>
            <span className="block text-[9px] text-gold-600 tracking-wider">BIENESTAR ESTÉTICO</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {LINKS.map((l) => {
          const active = pathname === l.href || (l.href !== "/dashboard" && pathname?.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active ? "bg-emerald-50 text-emerald-700" : "text-emerald-800/70 hover:bg-cream-100"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gold-700 hover:bg-gold-50 mt-4 border border-gold-200"
          >
            <span className="text-base">⚙️</span>
            Panel admin
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-cream-200">
        <div className="flex items-center gap-3 px-2 py-2">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={32} height={32} className="rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm">
              {profile?.name?.[0]?.toUpperCase() ?? "🙂"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-800 truncate">{profile?.name ?? "Cliente"}</p>
            <p className="text-[10px] text-emerald-800/50 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full mt-2 px-3 py-2 text-xs font-medium text-emerald-800/70 hover:text-emerald-700 hover:bg-cream-100 rounded-lg transition"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
