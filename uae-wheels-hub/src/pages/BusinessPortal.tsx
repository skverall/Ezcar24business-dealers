import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Lock, Mail, ArrowRight } from "lucide-react";
import EzcarLogo from "@/components/EzcarLogo";

const BusinessPortal = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      navigate("/business/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center animate-fade-in">
        <div className="bg-white/10 p-4 rounded-full backdrop-blur-md mb-4 border border-white/20 shadow-2xl">
          <EzcarLogo className="h-16 w-16 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">EZCAR24 Business</h1>
        <p className="text-slate-400 mt-2">Dealer & Business Management Portal</p>
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl border-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-900">Welcome Back</CardTitle>
          <CardDescription className="text-center text-slate-500">
            Enter your business credentials to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  placeholder="name@dealership.com" 
                  type="email" 
                  className="pl-10 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In to Dashboard <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 bg-slate-50/50 rounded-b-xl border-t border-slate-100 p-6">
          <div className="text-center text-sm text-slate-500">
            Don't have a business account?{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500 font-semibold hover:underline">
              Apply for Partnership
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Building2 className="h-3 w-3" />
            <span>Secure Business Environment</span>
          </div>
        </CardFooter>
      </Card>
      
      <div className="mt-8 text-center text-slate-500 text-sm">
        <p>&copy; 2024 EZCAR24 Business Solutions. All rights reserved.</p>
      </div>
    </div>
  );
};

export default BusinessPortal;
