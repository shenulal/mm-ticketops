import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import LoginPage from "@/pages/LoginPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import DashboardPage from "@/pages/DashboardPage";
import PurchasesPage from "@/pages/PurchasesPage";
import NewPurchasePage from "@/pages/NewPurchasePage";
import SalesPage from "@/pages/SalesPage";
import NewSalePage from "@/pages/NewSalePage";
import DistributionPage from "@/pages/DistributionPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Client/Supplier portals — no shell */}
            <Route path="/client-portal/:token" element={<PlaceholderPage title="Client Portal" />} />
            <Route path="/supplier-portal/:token" element={<PlaceholderPage title="Supplier Portal" />} />

            {/* App shell routes */}
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/events" element={<PlaceholderPage title="Events" />} />
              <Route path="/events/:id" element={<PlaceholderPage title="Event Detail" />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/purchases/new" element={<NewPurchasePage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/sales/new" element={<NewSalePage />} />
              <Route path="/distribution" element={<PlaceholderPage title="Distribution" />} />
              <Route path="/distribution/allocate/:id" element={<PlaceholderPage title="Allocate Distribution" />} />
              <Route path="/staff-queue" element={<PlaceholderPage title="Staff Queue" />} />
              <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
              <Route path="/users" element={<PlaceholderPage title="Users" />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
