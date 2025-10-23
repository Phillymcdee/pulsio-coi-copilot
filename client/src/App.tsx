import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import VendorDetail from "@/pages/vendor-detail";
import Vendors from "@/pages/vendors";
import Bills from "@/pages/bills";
import Settings from "@/pages/settings";
import Subscribe from "@/pages/subscribe";
import Upload from "@/pages/upload";
import Signup from "@/pages/signup";
import Security from "@/pages/security";
import Pricing from "@/pages/pricing";
import Competitive from "@/pages/competitive";
import Outbound from "@/pages/outbound";
import LandingPage from "@/components/marketing/LandingPage";
import ROICalculator from "@/components/marketing/ROICalculator";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/upload/:vendorId" component={Upload} />
      <Route path="/marketing" component={LandingPage} />
      <Route path="/roi-calculator" component={ROICalculator} />
      <Route path="/signup" component={Signup} />
      <Route path="/security" component={Security} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/competitive" component={Competitive} />
      <Route path="/outbound" component={Outbound} />
      
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={LandingPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/vendors/:id" component={VendorDetail} />
          <Route path="/bills" component={Bills} />
          <Route path="/settings" component={Settings} />
          <Route path="/subscribe" component={Subscribe} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleAnalytics />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
