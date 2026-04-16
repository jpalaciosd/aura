"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/AuthContext";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push(redirect);
  }, [user, loading, redirect, router]);

  const handleGoogleLogin = async () => {
    if (typeof window !== "undefined") localStorage.setItem("aura_redirect", redirect);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-amber/20 glow-blob rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-rose/10 glow-blob rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-10">
            <Image src="/logo.jpg" alt="AURA" width={52} height={52} className="rounded-full border border-primary-amber/40" />
            <div className="text-left leading-tight">
              <span className="block font-headline font-bold text-2xl text-primary-amber">AURA</span>
              <span className="block font-label text-[9px] tracking-[0.3em] text-white/50">BIENESTAR ESTÉTICO</span>
            </div>
          </Link>
          <span className="font-label text-[10px] tracking-[0.3em] text-primary-amber block mb-4">[ INGRESO ]</span>
          <h1 className="font-headline text-4xl md:text-5xl font-bold italic leading-[0.95]">
            Tu espacio <br/><span className="text-primary-amber">de bienestar</span>
          </h1>
          <p className="font-body text-sm text-white/60 mt-4 max-w-sm mx-auto">
            Ingresa con tu cuenta de Google para agendar citas, revisar tu historial y recibir confirmación inmediata.
          </p>
        </div>

        <div className="bg-surface-container border border-white/5 rounded-lg p-8">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-white/90 text-surface font-label text-[11px] tracking-[0.25em] uppercase rounded-full transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <p className="text-center text-white/40 text-[11px] mt-6 leading-relaxed">
            Usamos Google sólo para iniciar sesión.<br/>Nunca publicamos nada en tu cuenta.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="font-label text-[10px] tracking-[0.3em] text-white/50 hover:text-primary-amber transition-colors">
            ← VOLVER AL INICIO
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary-amber border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
