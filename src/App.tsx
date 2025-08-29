import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Fields from "./pages/Fields";
import Analytics from "./pages/Analytics";
import Fertilizer from "./pages/Fertilizer";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import GeospatialAnalysis from "./pages/GeospatialAnalysis";
import SatelliteMonitoring from "./pages/SatelliteMonitoring";
import NotFound from "./pages/NotFound";
import { APITestComponent } from "./components/APITestComponent";
import { ConsoleTest } from "./components/ConsoleTest";
import { AuthTest } from "./components/AuthTest";
import { DirectAPITest } from "./components/DirectAPITest";
import { SimpleTest } from "./components/SimpleTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/fields" element={<Fields />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/fertilizer" element={<Fertilizer />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/geospatial" element={<GeospatialAnalysis />} />
            <Route path="/satellite-monitoring" element={<SatelliteMonitoring />} />
            <Route path="/api-test" element={<APITestComponent />} />
            <Route path="/console-test" element={<ConsoleTest />} />
            <Route path="/auth-test" element={<AuthTest />} />
            <Route path="/direct-api-test" element={<DirectAPITest />} />
            <Route path="/simple-test" element={<SimpleTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
