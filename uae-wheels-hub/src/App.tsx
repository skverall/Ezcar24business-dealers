import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { CrmAuthProvider } from "@/hooks/useCrmAuth";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import BusinessProtectedRoute from "@/components/BusinessProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useIOSOptimizations } from "@/hooks/useIOSOptimizations";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import LanguageSync from "@/components/LanguageSync";
import LanguageRedirect from "@/components/LanguageRedirect";
import Index from "./pages/Index";
import ProfileSettings from "./pages/ProfileSettings";
import ProfileLayout from "./pages/ProfileLayout";
import BusinessLayout from "./pages/BusinessLayout";
import ProfileMyListings from "./pages/ProfileMyListings";
import ProfileDrafts from "./pages/ProfileDrafts";
import ProfileFavorites from "./pages/ProfileFavorites";
import ProfileActivity from "./pages/ProfileActivity";
import Auth from "./pages/Auth";
import CarDetail from "./pages/CarDetail";
import BrowseCars from "./pages/BrowseCars";
import ListCar from "./pages/ListCar";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import ConfirmEmail from "./pages/ConfirmEmail";
import CheckEmail from "./pages/CheckEmail";
import Messages from "./pages/Messages";
import AdminPanel from "./pages/AdminPanel";
import AdminRoute from "./components/admin/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";
import AdminTest from "./pages/AdminTest";
import CardTest from "./pages/CardTest";
import AdminCredentialsReset from "./pages/AdminCredentialsReset";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordResetTest from "./pages/PasswordResetTest";
import SecurityTestPage from "./pages/SecurityTestPage";
import NotFound from "./pages/NotFound";
import BusinessPortal from "./pages/BusinessPortal";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessInventory from "./pages/BusinessInventory";
import BusinessSales from "./pages/BusinessSales";
import BusinessExpenses from "./pages/BusinessExpenses";
import BusinessCustomers from "./pages/BusinessCustomers";
import BusinessSettings from "./pages/BusinessSettings";
import CarReports from "./pages/CarReports";
import VinCheck from "./pages/VinCheck";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Google Analytics Tracking ID - replace with your actual GA4 tracking ID
const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || 'G-KL81XZLWMG';

const App = () => {
  // Initialize iOS optimizations
  useIOSOptimizations();
  useViewportHeight();

  // Ensure main container respects safe area and full height on iOS
  useEffect(() => {
    document.documentElement.style.setProperty('--app-vh', `${(window.visualViewport?.height ?? window.innerHeight) * 0.01}px`);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <AuthProvider>
              <CrmAuthProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <ScrollToTop />
                    <LanguageSync />
                    <GoogleAnalytics trackingId={GA_TRACKING_ID} />
                    <Routes>
                      {/* Smart redirect to user's preferred language */}
                      <Route path="/" element={<LanguageRedirect />} />

                      {/* Localized routes */}
                      <Route path=":lang">
                        {/* Landing */}
                        <Route index element={<Index />} />

                        {/* Public pages */}
                        <Route path="browse" element={<BrowseCars />} />
                        <Route path="about" element={<About />} />
                        <Route path="car-reports" element={<CarReports />} />
                        <Route path="vin-check" element={<VinCheck />} />
                        <Route path="privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="terms-of-service" element={<TermsOfService />} />
                        <Route path="cookie-policy" element={<CookiePolicy />} />
                        <Route path="car/:id" element={<CarDetail />} />
                        <Route path="confirm-email" element={<ConfirmEmail />} />

                        {/* Auth & profile */}
                        <Route path="auth" element={<Auth />} />
                        <Route path="profile" element={
                          <ProtectedRoute>
                            <ProfileLayout />
                          </ProtectedRoute>
                        }>
                          <Route index element={<ProfileSettings />} />
                          <Route path="my-listings" element={<ProfileMyListings />} />
                          <Route path="drafts" element={<ProfileDrafts />} />
                          <Route path="favorites" element={<ProfileFavorites />} />
                          <Route path="activity" element={<ProfileActivity />} />
                        </Route>
                        <Route path="list-car" element={
                          <ProtectedRoute>
                            <ListCar />
                          </ProtectedRoute>
                        } />

                        {/* Admin panel */}
                        <Route path="admin/*" element={
                          <AdminRoute>
                            <AdminPanel />
                          </AdminRoute>
                        } />

                        {/* Misc */}
                        <Route path="messages" element={<Messages />} />
                        <Route path="check-email" element={<CheckEmail />} />
                        <Route path="card-test" element={<CardTest />} />
                        <Route path="admin-test" element={<AdminTest />} />
                        <Route path="admin-credentials-reset" element={<AdminCredentialsReset />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                        <Route path="password-reset-test" element={<PasswordResetTest />} />
                        <Route path="security-test" element={<SecurityTestPage />} />

                        {/* Business Portal Routes (Localized) */}
                        <Route path="business">
                          <Route index element={<BusinessPortal />} />
                          <Route element={<BusinessLayout />}>
                            <Route path="dashboard" element={<BusinessDashboard />} />
                            <Route path="inventory" element={<BusinessInventory />} />
                            <Route path="sales" element={<BusinessSales />} />
                            <Route path="expenses" element={<BusinessExpenses />} />
                            <Route path="customers" element={<BusinessCustomers />} />
                            <Route path="settings" element={<BusinessSettings />} />
                          </Route>
                        </Route>
                      </Route>

                      {/* Keep existing non-localized routes temporarily for backward compatibility */}
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <ProfileLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<ProfileSettings />} />
                        <Route path="my-listings" element={<ProfileMyListings />} />
                        <Route path="drafts" element={<ProfileDrafts />} />
                        <Route path="favorites" element={<ProfileFavorites />} />
                        <Route path="activity" element={<ProfileActivity />} />
                      </Route>
                      <Route path="/list-car" element={
                        <ProtectedRoute>
                          <ListCar />
                        </ProtectedRoute>
                      } />
                      <Route path="/test-photo-upload" element={<ListCar />} />
                      <Route path="/car/:id" element={<CarDetail />} />
                      <Route path="/browse" element={<BrowseCars />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/car-reports" element={<CarReports />} />
                      <Route path="/vin-check" element={<VinCheck />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-of-service" element={<TermsOfService />} />
                      <Route path="/cookie-policy" element={<CookiePolicy />} />
                      <Route path="/check-email" element={<CheckEmail />} />
                      <Route path="/confirm-email" element={<ConfirmEmail />} />
                      <Route path="/admin/*" element={
                        <AdminRoute>
                          <AdminPanel />
                        </AdminRoute>
                      } />
                      <Route path="/admin-test" element={<AdminTest />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/card-test" element={<CardTest />} />
                      <Route path="/admin-credentials-reset" element={<AdminCredentialsReset />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/password-reset-test" element={<PasswordResetTest />} />
                      <Route path="/security-test" element={<SecurityTestPage />} />
                      <Route path="/business">
                        <Route index element={<BusinessPortal />} />
                        <Route element={<BusinessLayout />}>
                          <Route path="dashboard" element={<BusinessDashboard />} />
                          <Route path="inventory" element={<BusinessInventory />} />
                          <Route path="sales" element={<BusinessSales />} />
                          <Route path="expenses" element={<BusinessExpenses />} />
                          <Route path="customers" element={<BusinessCustomers />} />
                          <Route path="settings" element={<BusinessSettings />} />
                        </Route>
                      </Route>
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </CrmAuthProvider>
            </AuthProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
