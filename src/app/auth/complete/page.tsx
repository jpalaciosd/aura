"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = typeof window !== "undefined" ? localStorage.getItem("aura_redirect") || "/dashboard" : "/dashboard";
    if (typeof window !== "undefined") localStorage.removeItem("aura_redirect");
    router.push(redirect);
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-primary-amber border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-label text-[11px] tracking-[0.3em] text-white/60 uppercase">Entrando a tu cuenta...</p>
      </div>
    </div>
  );
}
