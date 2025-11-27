import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { crmSupabase } from '@/integrations/supabase/crmClient';
import { useToast } from '@/hooks/use-toast';

interface CrmAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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

  const signOut = async () => {
    const { error } = await crmSupabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out of the business portal."
      });
    }
  };

  return (
    <CrmAuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signOut
    }}>
      {children}
    </CrmAuthContext.Provider>
  );
};
