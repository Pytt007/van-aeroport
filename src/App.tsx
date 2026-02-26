import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/theme-provider";
import SplashScreen from "@/components/SplashScreen";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Index from "./pages/Index";
import Vehicles from "./pages/Vehicles";
import Rentals from "./pages/Rentals";
import VehicleDetail from "./pages/VehicleDetail";
import Charging from "./pages/Charging";
import Booking from "./pages/Booking";
import Tracking from "./pages/Tracking";
import Rating from "./pages/Rating";
import Recents from "./pages/Recents";
import RideBooking from "./pages/RideBooking";
import Favoris from "./pages/Favoris";
import Adresses from "./pages/Adresses";
import Confidentialite from "./pages/Confidentialite";
import Aide from "./pages/Aide";
import Parametres from "./pages/Parametres";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSuccess from "./pages/RegisterSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

const isAuthRedirect = () => {
  return window.location.hash.includes("access_token=") ||
    window.location.hash.includes("type=recovery") ||
    window.location.search.includes("code=");
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isAuthProcessing, setIsAuthProcessing] = useState(isAuthRedirect());

  useEffect(() => {
    // If we're on a deep-link/auth-redirect URL, it might take a moment to process.
    // We clean it up and hide loading once we have a definitive auth state.
    if (!loading) {
      const timer = setTimeout(() => {
        setIsAuthProcessing(false);
        // Clean up fragments once we have processed them
        if (window.location.hash.includes("access_token=") || window.location.hash.includes("error=")) {
          // We use replaceState instead of navigate to not trigger router re-mounts
          window.history.replaceState(null, "", window.location.pathname);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || isAuthProcessing) return <LoadingScreen />;
  if (!user) {
    // If we were expecting an auth redirect but got no user, we force go to login
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("splashShown");
  });

  const handleSplashFinish = () => {
    setShowSplash(false);
    sessionStorage.setItem("splashShown", "true");
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      </AnimatePresence>

      <div className={showSplash ? "hidden" : "block"}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/register-success" element={<PublicRoute><RegisterSuccess /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/rentals" element={<ProtectedRoute><Rentals /></ProtectedRoute>} />
          <Route path="/vehicle-detail" element={<ProtectedRoute><VehicleDetail /></ProtectedRoute>} />
          <Route path="/charging" element={<ProtectedRoute><Charging /></ProtectedRoute>} />
          <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
          <Route path="/rating" element={<ProtectedRoute><Rating /></ProtectedRoute>} />
          <Route path="/recents" element={<ProtectedRoute><Recents /></ProtectedRoute>} />
          <Route path="/ride-booking" element={<ProtectedRoute><RideBooking /></ProtectedRoute>} />
          <Route path="/favoris" element={<ProtectedRoute><Favoris /></ProtectedRoute>} />
          <Route path="/adresses" element={<ProtectedRoute><Adresses /></ProtectedRoute>} />
          <Route path="/confidentialite" element={<ProtectedRoute><Confidentialite /></ProtectedRoute>} />
          <Route path="/aide" element={<ProtectedRoute><Aide /></ProtectedRoute>} />
          <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
          <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="ride-syne-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PWAInstallPrompt />
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
