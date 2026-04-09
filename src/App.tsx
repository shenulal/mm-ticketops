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
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

// Pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import EventsPage from "@/pages/EventsPage";
import EventDetailPage from "@/pages/EventDetailPage";
import PurchasesPage from "@/pages/PurchasesPage";
import NewPurchasePage from "@/pages/NewPurchasePage";
import SalesPage from "@/pages/SalesPage";
import NewSalePage from "@/pages/NewSalePage";
import DistributionPage from "@/pages/DistributionPage";
import AllocationPreviewPage from "@/pages/AllocationPreviewPage";
import StaffQueuePage from "@/pages/StaffQueuePage";
import StaffTaskDetailPage from "@/pages/StaffTaskDetailPage";
import SupplierPortalsPage from "@/pages/SupplierPortalsPage";
import ReportsPage from "@/pages/ReportsPage";
import ClientPortalPage from "@/pages/ClientPortalPage";
import SupplierPortalPage from "@/pages/SupplierPortalPage";

// Supplier Portal
import SupplierLayout from "@/components/SupplierLayout";
import SupplierDashboardPage from "@/pages/supplier/SupplierDashboardPage";
import SupplierMatchPage from "@/pages/supplier/SupplierMatchPage";
import SupplierSettingsPage from "@/pages/supplier/SupplierSettingsPage";

// Master Data
import VendorsPage from "@/pages/masters/VendorsPage";
import ClientsPage from "@/pages/masters/ClientsPage";
import ContractsPage from "@/pages/masters/ContractsPage";
import VenuesPage from "@/pages/masters/VenuesPage";
import CurrenciesPage from "@/pages/masters/CurrenciesPage";

// Administration
import UsersPage from "@/pages/UsersPage";
import SettingsPage from "@/pages/SettingsPage";
import VendorCredentialsPage from "@/pages/VendorCredentialsPage";
import AuditLogPage from "@/pages/AuditLogPage";
import ReconciliationPage from "@/pages/ReconciliationPage";
import NotFoundPage from "@/pages/NotFoundPage";

const queryClient = new QueryClient();

const PURCHASING_ROLES = ['super_admin', 'event_admin', 'ops_manager', 'sr_operator', 'operator'];
const FULFILMENT_ROLES = ['super_admin', 'event_admin', 'ops_manager', 'sr_operator'];
const MASTER_ROLES = ['super_admin', 'event_admin', 'ops_manager'];
const ADMIN_ROLES = ['super_admin', 'event_admin'];
const SETTINGS_ROLES = ['super_admin'];

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
              {/* Public routes — no AppShell */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/client-portal/:token" element={<ClientPortalPage />} />
              <Route path="/supplier-portal/:token" element={<SupplierPortalPage />} />

              {/* Supplier Portal — dedicated layout */}
              <Route element={<ProtectedRoute><SupplierLayout /></ProtectedRoute>}>
                <Route path="/supplier" element={<SupplierDashboardPage />} />
                <Route path="/supplier/match/:matchId" element={<SupplierMatchPage />} />
                <Route path="/supplier/settings" element={<SupplierSettingsPage />} />
              </Route>
              {/* Protected routes — wrapped in AppShell */}
              <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                {/* MAIN */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />

                {/* PURCHASING */}
                <Route path="/purchases" element={
                  <RoleProtectedRoute allowedRoles={PURCHASING_ROLES} redirectTo="/staff-queue">
                    <PurchasesPage />
                  </RoleProtectedRoute>
                } />
                <Route path="/purchases/new" element={
                  <RoleProtectedRoute allowedRoles={PURCHASING_ROLES} redirectTo="/staff-queue">
                    <NewPurchasePage />
                  </RoleProtectedRoute>
                } />

                {/* SELLING */}
                <Route path="/sales" element={
                  <RoleProtectedRoute allowedRoles={PURCHASING_ROLES} redirectTo="/staff-queue">
                    <SalesPage />
                  </RoleProtectedRoute>
                } />
                <Route path="/sales/new" element={
                  <RoleProtectedRoute allowedRoles={PURCHASING_ROLES} redirectTo="/staff-queue">
                    <NewSalePage />
                  </RoleProtectedRoute>
                } />

                {/* FULFILMENT */}
                <Route path="/distribution" element={
                  <RoleProtectedRoute allowedRoles={FULFILMENT_ROLES}>
                    <DistributionPage />
                  </RoleProtectedRoute>
                } />
                <Route path="/distribution/allocate/:id" element={
                  <RoleProtectedRoute allowedRoles={FULFILMENT_ROLES}>
                    <DistributionPage />
                  </RoleProtectedRoute>
                } />
                <Route path="/distribution/:saleId/preview" element={
                  <RoleProtectedRoute allowedRoles={FULFILMENT_ROLES}>
                    <AllocationPreviewPage />
                  </RoleProtectedRoute>
                } />
                <Route path="/staff-queue" element={<StaffQueuePage />} />
                <Route path="/staff-queue/:taskId" element={<StaffTaskDetailPage />} />
                <Route path="/supplier-portals" element={
                  <RoleProtectedRoute allowedRoles={FULFILMENT_ROLES}>
                    <SupplierPortalsPage />
                  </RoleProtectedRoute>
                } />

                {/* INTELLIGENCE */}
                <Route path="/reports" element={
                  <RoleProtectedRoute allowedRoles={[...FULFILMENT_ROLES]}>
                    <ReportsPage />
                  </RoleProtectedRoute>
                } />

                {/* MASTER DATA */}
                <Route path="/masters/vendors" element={
                  <RoleProtectedRoute allowedRoles={MASTER_ROLES}><VendorsPage /></RoleProtectedRoute>
                } />
                <Route path="/masters/clients" element={
                  <RoleProtectedRoute allowedRoles={MASTER_ROLES}><ClientsPage /></RoleProtectedRoute>
                } />
                <Route path="/masters/contracts" element={
                  <RoleProtectedRoute allowedRoles={MASTER_ROLES}><ContractsPage /></RoleProtectedRoute>
                } />
                <Route path="/masters/venues" element={
                  <RoleProtectedRoute allowedRoles={MASTER_ROLES}><VenuesPage /></RoleProtectedRoute>
                } />
                <Route path="/masters/currencies" element={
                  <RoleProtectedRoute allowedRoles={ADMIN_ROLES}><CurrenciesPage /></RoleProtectedRoute>
                } />

                {/* ADMINISTRATION */}
                <Route path="/admin/users" element={
                  <RoleProtectedRoute allowedRoles={ADMIN_ROLES}><UsersPage /></RoleProtectedRoute>
                } />
                <Route path="/admin/notifications" element={
                  <RoleProtectedRoute allowedRoles={ADMIN_ROLES}><UsersPage /></RoleProtectedRoute>
                } />
                <Route path="/admin/vendor-credentials" element={
                  <RoleProtectedRoute allowedRoles={FULFILMENT_ROLES}><VendorCredentialsPage /></RoleProtectedRoute>
                } />
                <Route path="/admin/audit-log" element={
                  <RoleProtectedRoute allowedRoles={SETTINGS_ROLES}><AuditLogPage /></RoleProtectedRoute>
                } />
                <Route path="/admin/reconciliation" element={
                  <RoleProtectedRoute allowedRoles={['super_admin', 'ops_manager']}><ReconciliationPage /></RoleProtectedRoute>
                } />

                {/* SETTINGS */}
                <Route path="/settings" element={<Navigate to="/settings/org" replace />} />
                <Route path="/settings/:section" element={
                  <RoleProtectedRoute allowedRoles={SETTINGS_ROLES}><SettingsPage /></RoleProtectedRoute>
                } />

                {/* CATCH ALL inside protected layout */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* ROOT redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </EventProvider>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
