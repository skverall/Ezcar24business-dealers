import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

const CheckEmail = () => {
  return (
    <div className="mobile-viewport-fix bg-gradient-to-br from-background to-secondary/20 flex flex-col w-full overflow-x-hidden">
      <Header />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-effect rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-luxury/10 mx-auto flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-luxury" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">Check Your Email</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We've sent a confirmation link to your email address. Click the link to activate your account and get started.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">Didn't receive the email?</p>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Check your spam or junk folder</li>
                <li>• Verify you entered the correct email address</li>
                <li>• Wait a few minutes for delivery</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              to="/auth?tab=login" 
              className="px-6 py-3 bg-luxury text-white rounded-lg hover:bg-luxury/90 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link 
              to="/" 
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CheckEmail;
