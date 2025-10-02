import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

// Import all page components
import Home from "@/pages/Home";
import AnimeDetail from "@/pages/AnimeDetail";
import Profile from "@/pages/Profile";
import AdminPanel from "@/pages/AdminPanel";
import Browse from "@/pages/Browse";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

// Router component handling all application routes
function Router() {
  return (
    <Switch>
      {/* Public routes accessible to all users */}
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/anime/:id" component={AnimeDetail} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes requiring authentication */}
      <Route path="/profile" component={Profile} />
      
      {/* Admin-only routes with role verification */}
      <Route path="/admin" component={AdminPanel} />
      
      {/* Fallback route for 404 errors */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Main application component with providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
