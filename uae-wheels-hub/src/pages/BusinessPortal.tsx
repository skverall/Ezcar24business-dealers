import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Lock, Mail, ArrowRight, User } from "lucide-react";
import EzcarLogo from "@/components/EzcarLogo";
import { useCrmAuth } from "@/hooks/useCrmAuth";

const BusinessPortal = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useCrmAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (!loading && user) {
      navigate("/business/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const action = mode === "signin" ? signIn : signUp;
    const { error } = await action(email, password, fullName);

    if (!error && mode === "signin") {
      navigate("/business/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 md:top-8 md:left-8 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 gap-2 group z-10"
        onClick={() => navigate("/")}
      >
        <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
        Back to Listings
      </Button>

      <div className="mb-8 flex flex-col items-center animate-fade-in z-10">
        <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-xl mb-6 border border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] ring-1 ring-white/20">
          <EzcarLogo className="h-16 w-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
        </div>
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
            EZCAR24 Business
          </h1>
          <img
            src="/ezcar_logo_new.png"
            alt="EZCAR24 Logo"
            className="h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
          />
        </div>
        <p className="text-slate-400 text-lg font-light tracking-wide">Dealer & Business Management Portal</p>
      </div>

      <Card className="w-full max-w-md bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] border border-white/10 z-10">
        <CardHeader className="space-y-1 pb-6">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/50 rounded-lg mb-6 border border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode("signin")}
              className={`w-full transition-all duration-300 ${mode === "signin"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode("signup")}
              className={`w-full transition-all duration-300 ${mode === "signup"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              Sign Up
            </Button>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">
            {mode === "signin" ? "Welcome Back" : "Create Business Account"}
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            {mode === "signin"
              ? "Enter your business credentials to access your dashboard"
              : "Create an account to access the business portal"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="fullName"
                    placeholder="Your name"
                    type="text"
                    className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Business Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  id="email"
                  placeholder="name@dealership.com"
                  type="email"
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                {mode === "signin" && (
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-6 shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.6)]"
              disabled={isLoading || loading}
            >
              {isLoading ? (
                mode === "signin" ? "Signing in..." : "Creating account..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {mode === "signin" ? "Sign In to Dashboard" : "Sign Up"} <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 bg-slate-900/30 rounded-b-xl border-t border-white/5 p-6">
          {mode === "signin" ? (
            <div className="text-center text-sm text-slate-400">
              Don't have a business account?{" "}
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors"
                onClick={() => setMode("signup")}
              >
                Create one
              </button>
            </div>
          ) : (
            <div className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Building2 className="h-3 w-3" />
            <span>Secure Business Environment</span>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-slate-600 text-sm z-10">
        <p>&copy; 2024 EZCAR24 Business Solutions. All rights reserved.</p>
      </div>
    </div>
  );
};

export default BusinessPortal;
