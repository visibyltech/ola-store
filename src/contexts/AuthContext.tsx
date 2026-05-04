import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const logActivity = async (
  eventType: string,
  userId: string | null,
  email: string | null,
  metadata: Record<string, unknown> = {}
) => {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      event_type: eventType,
      email,
      user_agent: navigator.userAgent.slice(0, 200),
      metadata,
    });
  } catch {
    // Silently fail — logging should never break the auth flow
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => checkAdminRole(session.user.id), 0);
          if (event === "SIGNED_IN") {
            setTimeout(() => logActivity("login", session.user.id, session.user.email ?? null, {
              provider: session.user.app_metadata?.provider ?? "email",
            }), 0);
          }
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) checkAdminRole(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone ?? "" } },
    });

    if (!error && data.user) {
      await logActivity("signup", data.user.id, email, { full_name: fullName, phone: phone ?? "" });
      if (phone) {
        await supabase.from("profiles").update({ phone }).eq("user_id", data.user.id);
      }
    } else if (error) {
      await logActivity("signup_failed", null, email, { reason: error.message });
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await logActivity("login_failed", null, email, { reason: error.message });
    }
    // Successful login is logged via onAuthStateChange SIGNED_IN event

    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (user) {
      await logActivity("logout", user.id, user.email ?? null, {});
    }
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
