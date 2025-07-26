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
import Settings from "@/pages/settings";
import Subscribe from "@/pages/subscribe";
import Upload from "@/pages/upload";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/upload/:vendorId" component={Upload} />
      
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/vendors/:id" component={VendorDetail} />
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
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
