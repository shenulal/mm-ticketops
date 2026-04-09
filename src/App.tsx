import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { EventProvider } from "@/context/EventContext";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PurchasesPage from "@/pages/PurchasesPage";
import NewPurchasePage from "@/pages/NewPurchasePage";
import SalesPage from "@/pages/SalesPage";
import NewSalePage from "@/pages/NewSalePage";
import DistributionPage from "@/pages/DistributionPage";
import ClientPortalPage from "@/pages/ClientPortalPage";
import StaffQueuePage from "@/pages/StaffQueuePage";
import SupplierPortalPage from "@/pages/SupplierPortalPage";
import ReportsPage from "@/pages/ReportsPage";
import UsersPage from "@/pages/UsersPage";
import EventsPage from "@/pages/EventsPage";
import EventDetailPage from "@/pages/EventDetailPage";
import SettingsPage from "@/pages/SettingsPage";
import VendorsPage from "@/pages/masters/VendorsPage";
import ClientsPage from "@/pages/masters/ClientsPage";
import ContractsPage from "@/pages/masters/ContractsPage";
import VenuesPage from "@/pages/masters/VenuesPage";
import CurrenciesPage from "@/pages/masters/CurrenciesPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppProvider>
        <EventProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Portals — no shell */}
              <Route path="/client-portal/:token" element={<ClientPortalPage />} />
              <Route path="/supplier-portal/:token" element={<SupplierPortalPage />} />

              {/* App shell routes — protected */}
              <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/purchases" element={<PurchasesPage />} />
                <Route path="/purchases/new" element={<NewPurchasePage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales/new" element={<NewSalePage />} />
                <Route path="/distribution" element={<DistributionPage />} />
                <Route path="/distribution/allocate/:id" element={<DistributionPage />} />
                <Route path="/staff-queue" element={<StaffQueuePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/masters/vendors" element={<VendorsPage />} />
                <Route path="/masters/clients" element={<ClientsPage />} />
                <Route path="/masters/contracts" element={<ContractsPage />} />
                <Route path="/masters/venues" element={<VenuesPage />} />
                <Route path="/masters/currencies" element={<CurrenciesPage />} />
                <Route path="/admin/:section" element={<AdminPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/:section" element={<SettingsPage />} />
                <Route path="/supplier-portals" element={<DistributionPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </EventProvider>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
