import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { crmSupabase } from '@/integrations/supabase/crmClient';
import { useToast } from '@/hooks/use-toast';

interface CrmAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const CrmAuthContext = createContext<CrmAuthContextType | undefined>(undefined);

export const useCrmAuth = () => {
  const context = useContext(CrmAuthContext);
  if (!context) {
    throw new Error('useCrmAuth must be used within a CrmAuthProvider');
  }
  return context;
};

export const CrmAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = crmSupabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    crmSupabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await crmSupabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Business sign in failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back",
        description: "Signed in to the business portal."
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await crmSupabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email
        }
      }
    });

    if (error) {
      toast({
        title: "Business sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      const needsVerification = !data.session;
      toast({
        title: needsVerification ? "Confirm your email" : "Account created",
        description: needsVerification ? "We sent a confirmation link to your email." : "You are signed in."
      });
    }

    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await crmSupabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        // If the session is missing or invalid, we should still clear local state
        if (error.message.includes("session") || error.status === 403 || error.status === 401) {
          // Force cleanup
          setSession(null);
          setUser(null);
          localStorage.removeItem('sb-crm-auth-token');
          toast({
            title: "Signed out",
            description: "You have been signed out locally.",
          });
          return;
        }

        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setSession(null);
        setUser(null);
        toast({
          title: "Signed out",
          description: "You have been signed out of the business portal."
        });
      }
    } catch (e) {
      console.error("Unexpected sign out error:", e);
      // Force cleanup on unexpected error
      setSession(null);
      setUser(null);
      localStorage.removeItem('sb-crm-auth-token');
      toast({
        title: "Signed out",
        description: "You have been signed out.",
      });
    }
  };

  return (
    <CrmAuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </CrmAuthContext.Provider>
  );
};
