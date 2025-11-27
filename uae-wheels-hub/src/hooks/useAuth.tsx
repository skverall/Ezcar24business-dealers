import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateInput, sanitizeText } from '@/components/security/InputSanitizer';
import { getEmailConfirmUrl } from '@/utils/urlConfig';
import { pushNotificationService } from '@/services/pushNotifications';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string, isDealer?: boolean, companyName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Initialize push notifications when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await pushNotificationService.initialize();
            await pushNotificationService.updateUserToken();
          } catch (error) {
            console.error('Error initializing push notifications:', error);
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Initialize push notifications if user is already signed in
      if (session?.user) {
        try {
          await pushNotificationService.initialize();
          await pushNotificationService.updateUserToken();
        } catch (error) {
          console.error('Error initializing push notifications:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string, isDealer: boolean = false, companyName: string = '') => {
    // SECURITY: Validate input before sending to server
    if (!validateInput.email(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return { error: { message: "Invalid email format" } };
    }

    if (!validateInput.name(fullName)) {
      toast({
        title: "Invalid name",
        description: "Name must be between 2 and 100 characters.",
        variant: "destructive"
      });
      return { error: { message: "Invalid name format" } };
    }

    if (phone && !validateInput.phone(phone)) {
      toast({
        title: "Invalid phone",
        description: "Please enter a valid phone number.",
        variant: "destructive"
      });
      return { error: { message: "Invalid phone format" } };
    }

    // SECURITY: Sanitize inputs
    const sanitizedFullName = sanitizeText(fullName);
    const sanitizedPhone = phone ? sanitizeText(phone) : null;

    const redirectUrl = getEmailConfirmUrl();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: sanitizedFullName,
          phone: sanitizedPhone,
          is_dealer: isDealer,
          company_name: isDealer ? sanitizeText(companyName) : null
        }
      }
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      const alreadyExists = msg.includes('already') && (msg.includes('registered') || msg.includes('exists'));
      toast({
        title: alreadyExists ? 'User already exists' : 'Sign up failed',
        description: alreadyExists
          ? 'An account with this email already exists. Please sign in or use Forgot Password to reset your password.'
          : error.message,
        variant: 'destructive'
      });
    } else {
      // Supabase can return success even if the email is already registered (it may resend the confirmation email).
      // In that case, the returned user will have no identities.
      const alreadyExists = (data?.user?.identities?.length ?? 0) === 0;
      if (alreadyExists) {
        toast({
          title: 'User already exists',
          description: 'An account with this email already exists. Please sign in or use Forgot Password to reset your password.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Sign up successful',
          description: 'Please check your email to confirm your account.',
        });
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // SECURITY: Validate email format before sending
    if (!validateInput.email(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return { error: { message: "Invalid email format" } };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};