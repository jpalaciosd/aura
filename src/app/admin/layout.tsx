"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile) { router.push("/login?redirect=/admin"); return; }
    if (profile.role !== "admin") router.push("/dashboard");
  }, [profile, loading, router]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (profile.role !== "admin") return null;

  return (
    <div className="min-h-screen flex bg-cream-50">
      <div className="hidden md:flex">
        <AdminSidebar />
      </div>
      <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
    </div>
  );
}
