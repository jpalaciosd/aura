"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ClientSidebar from "@/components/ClientSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/dashboard");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-cream-50">
      <div className="hidden md:flex">
        <ClientSidebar />
      </div>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
