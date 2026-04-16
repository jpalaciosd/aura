"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";
import type { DbUser } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: DbUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

const ADMIN_EMAIL_SEED = process.env.NEXT_PUBLIC_ADMIN_EMAIL_SEED?.toLowerCase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string, name: string, avatar: string) => {
    let { data } = await supabase.from("users").select("*").eq("google_id", userId).maybeSingle();
    if (data) { setProfile(data); return; }

    ({ data } = await supabase.from("users").select("*").eq("email", email).maybeSingle());
    if (data) {
      await supabase
        .from("users")
        .update({ google_id: userId, avatar_url: avatar || data.avatar_url })
        .eq("id", data.id);
      setProfile({ ...data, google_id: userId });
      return;
    }

    const initialRole = ADMIN_EMAIL_SEED && email.toLowerCase() === ADMIN_EMAIL_SEED ? "admin" : "client";
    const { data: newUser } = await supabase
      .from("users")
      .insert({
        email,
        name: name || email.split("@")[0],
        avatar_url: avatar || null,
        google_id: userId,
        role: initialRole,
      })
      .select()
      .maybeSingle();

    setProfile(newUser);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("users").select("*").eq("google_id", user.id).maybeSingle();
    if (data) setProfile(data);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const meta = s.user.user_metadata;
        fetchProfile(s.user.id, s.user.email || "", meta?.full_name || "", meta?.avatar_url || "");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const meta = s.user.user_metadata;
        fetchProfile(s.user.id, s.user.email || "", meta?.full_name || "", meta?.avatar_url || "");
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
