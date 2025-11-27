import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Footer from "@/components/Footer";
import EzcarLogo from "@/components/EzcarLogo";
import { Mail, Lock, User, Phone, ArrowLeft, Home, Building2, UserCheck, Eye, EyeOff } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import HCaptcha from '@/components/HCaptcha';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { useKeyboardStatus } from '@/hooks/useKeyboardStatus';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    userType: 'individual',
    companyName: ''
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  // Feature flag: enable captcha only if explicitly turned on AND sitekey present
  const captchaEnabled: boolean = ((import.meta as any).env.VITE_ENABLE_HCAPTCHA === 'true') && Boolean((import.meta as any).env.VITE_HCAPTCHA_SITEKEY);

  // Get the tab from URL params, default to 'login'
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const redirectTo = searchParams.get('redirect') || '/';

  // Adjust viewport height for mobile keyboards
  useViewportHeight();
  const keyboardOpen = useKeyboardStatus();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate(redirectTo);
    }
  }, [user, navigate, redirectTo]);

  // Phone number validation function
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all spaces and non-numeric characters except +
    const cleaned = phone.replace(/\s/g, '');

    // UAE phone number formats:
    // +971XXXXXXXXX (9 digits after +971)
    // 971XXXXXXXXX (9 digits after 971)
    // 05XXXXXXXX (8 digits after 05)
    // 5XXXXXXXX (8 digits after 5)

    // Check for +971 format (should have 9 digits after +971)
    if (cleaned.startsWith('+971')) {
      const digits = cleaned.slice(4);
      return /^[0-9]{9}$/.test(digits);
    }

    // Check for 971 format (should have 9 digits after 971)
    if (cleaned.startsWith('971')) {
      const digits = cleaned.slice(3);
      return /^[0-9]{9}$/.test(digits);
    }

    // Check for 05 format (should have 8 digits after 05)
    if (cleaned.startsWith('05')) {
      const digits = cleaned.slice(2);
      return /^[0-9]{8}$/.test(digits);
    }

    // Check for 5 format (should have 8 digits after 5)
    if (cleaned.startsWith('5')) {
      const digits = cleaned.slice(1);
      return /^[0-9]{8}$/.test(digits);
    }

    return false;
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters except +
    const cleaned = value.replace(/[^\d+]/g, '');

    // If starts with +971, format as +971 XX XXX XXXX
    if (cleaned.startsWith('+971')) {
      const number = cleaned.slice(4);
      if (number.length === 0) return '+971 ';
      if (number.length <= 2) return `+971 ${number}`;
      if (number.length <= 5) return `+971 ${number.slice(0, 2)} ${number.slice(2)}`;
      return `+971 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 9)}`;
    }

    // If starts with 971, format as +971 XX XXX XXXX (auto-add +)
    if (cleaned.startsWith('971')) {
      const number = cleaned.slice(3);
      if (number.length === 0) return '+971 ';
      if (number.length <= 2) return `+971 ${number}`;
      if (number.length <= 5) return `+971 ${number.slice(0, 2)} ${number.slice(2)}`;
      return `+971 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 9)}`;
    }

    // If starts with 05 or 5, format as 05X XXX XXXX
    if (cleaned.startsWith('05') || cleaned.startsWith('5')) {
      const number = cleaned.startsWith('05') ? cleaned : '0' + cleaned;
      if (number.length <= 3) return number;
      if (number.length <= 6) return `${number.slice(0, 3)} ${number.slice(3)}`;
      return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 10)}`;
    }

    // If user starts typing digits (not starting with 0), assume UAE format and add +971
    if (cleaned.length > 0 && !cleaned.startsWith('+') && !cleaned.startsWith('0') && !cleaned.startsWith('971')) {
      return formatPhoneNumber('+971' + cleaned);
    }

    return cleaned;
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginForm.email, loginForm.password);
    
    if (!error) {
      navigate(redirectTo);
    }
    
    setIsLoading(false);
  };

  const [captchaToken, setCaptchaToken] = useState<string | null>(null); // used only when captchaEnabled

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Require captcha token only if captcha is enabled
    if (captchaEnabled && !captchaToken) {
      toast({ title: 'Verification required', description: 'Please complete the hCaptcha.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // Validate phone number
    if (!validatePhoneNumber(signupForm.phone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid UAE phone number (e.g., +971 50 123 4567 or 050 123 4567)",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Clean and format phone number before saving
    let cleanedPhone = signupForm.phone.replace(/\s/g, '');

    // If phone starts with 0, convert to +971 format
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '+971' + cleanedPhone.substring(1);
    }
    // If phone starts with 971, add +
    else if (cleanedPhone.startsWith('971')) {
      cleanedPhone = '+' + cleanedPhone;
    }
    // If phone doesn't start with +, assume UAE format
    else if (!cleanedPhone.startsWith('+')) {
      cleanedPhone = '+971' + cleanedPhone;
    }

    const { error } = await signUp(
      signupForm.email,
      signupForm.password,
      signupForm.fullName,
      cleanedPhone,
      signupForm.userType === 'dealer',
      signupForm.companyName
    );

    setIsLoading(false);

    // On success, redirect to the "Check Email" page
    if (!error) {
      navigate('/check-email');
    }
  };

  return (
    <div className={`mobile-viewport-fix bg-gradient-to-br from-background to-secondary/20 flex flex-col w-full overflow-x-hidden ${keyboardOpen ? 'pb-[env(safe-area-inset-bottom)]' : ''}`}>
      {/* Navigation Header */}
      <div className="p-4 w-full sticky top-0 z-10 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-md">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-luxury transition-all duration-300 group hover:bg-luxury/5 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm font-medium">{t('auth.backHome')}</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group">
            <div className="flex items-center justify-center gap-3 mb-4 group-hover:scale-105 transition-transform duration-300">
              <EzcarLogo className="h-12 w-12" />
              <span className="text-3xl font-bold text-luxury">EZCAR24</span>
            </div>
          </Link>
          <p className="text-muted-foreground">{t('auth.welcome')}</p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t('nav.signIn')}</TabsTrigger>
            <TabsTrigger value="signup">{t('nav.signUp')}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>{t('nav.signIn')}</CardTitle>
                <CardDescription>
                  {/* TODO: i18n: login subtitle */}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('footer.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder={t('footer.email')}
                        className="pl-10"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder={t('auth.password')}
                        className="pl-10 pr-10"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showLoginPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition"
                        onClick={() => setShowLoginPassword((v) => !v)}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.signingIn') : t('nav.signIn')}
                  </Button>

                  <div className="text-center pt-4 border-t">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>{t('nav.signUp')}</CardTitle>
                <CardDescription>
                  {/* TODO: i18n: signup subtitle */}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder={t('auth.fullName')}
                        className="pl-10"
                        value={signupForm.fullName}
                        onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('footer.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t('footer.email')}
                        className="pl-10"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">{t('auth.phone')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder={'+971 50 123 4567'}
                        className="pl-10"
                        value={signupForm.phone}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          setSignupForm({ ...signupForm, phone: formatted });
                        }}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('auth.phoneHint')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Account Type</Label>
                    <RadioGroup
                      value={signupForm.userType}
                      onValueChange={(value) => setSignupForm({ ...signupForm, userType: value, companyName: value === 'individual' ? '' : signupForm.companyName })}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                          <UserCheck className="h-4 w-4" />
                          Individual
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dealer" id="dealer" />
                        <Label htmlFor="dealer" className="flex items-center gap-2 cursor-pointer">
                          <Building2 className="h-4 w-4" />
                          Dealer
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {signupForm.userType === 'dealer' && (
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company-name"
                          type="text"
                          placeholder={t('auth.companyNamePlaceholder')}
                          className="pl-10"
                          value={signupForm.companyName}
                          onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder={t('auth.passwordPlaceholder')}
                        className="pl-10 pr-10"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showSignupPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition"
                        onClick={() => setShowSignupPassword((v) => !v)}
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* hCaptcha for anti-bot verification (optional via feature flag) */}
                  {captchaEnabled && (
                    <div className="flex justify-center">
                      <HCaptcha onVerify={(t) => setCaptchaToken(t)} theme="light" />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || (captchaEnabled && !captchaToken)}
                  >
                    {isLoading ? t('auth.creatingAccount') : t('nav.signUp')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Additional Navigation */}
      <div className="p-4 border-t border-border/20 bg-muted/20 w-full">
        <div className="w-full max-w-md mx-auto text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-luxury transition-all duration-300 group hover:bg-luxury/5 px-4 py-2 rounded-lg"
          >
            <Home className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">{t('footer.links.explore')}</span>
          </Link>
        </div>
      </div>

      {/* Hide footer when keyboard is open to avoid shrinking content */}
      {!keyboardOpen && <Footer />}
    </div>
  );
};

export default Auth;