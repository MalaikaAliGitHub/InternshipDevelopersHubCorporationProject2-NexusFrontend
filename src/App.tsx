// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Dashboard Pages
import { EntrepreneurDashboard } from './pages/dashboard/EntrepreneurDashboard';
import { InvestorDashboard } from './pages/dashboard/InvestorDashboard';

// Profile Pages
import { EntrepreneurProfile } from './pages/profile/EntrepreneurProfile';
import { InvestorProfile } from './pages/profile/InvestorProfile';

// Feature Pages
import { InvestorsPage } from './pages/investors/InvestorsPage';
import { EntrepreneursPage } from './pages/entrepreneurs/EntrepreneursPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';
import { DealsPage } from './pages/deals/DealsPage';
import CalendarPage from './pages/calendar/CalendarPage';

// Payment Pages
import PaymentPage from './pages/payment/PaymentPage';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailed from './pages/payment/PaymentFailed';


// Chat
import { ChatPage } from './pages/chat/ChatPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* All Dashboard & Protected Routes */}
          <Route element={<DashboardLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard/entrepreneur" element={<EntrepreneurDashboard />} />
            <Route path="/dashboard/investor" element={<InvestorDashboard />} />

            {/* Profiles */}
            <Route path="/profile/entrepreneur/:id" element={<EntrepreneurProfile />} />
            <Route path="/profile/investor/:id" element={<InvestorProfile />} />

            {/* Features */}
            <Route path="/investors" element={<InvestorsPage />} />
            <Route path="/entrepreneurs" element={<EntrepreneursPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/deals" element={<DealsPage />} />

            {/* Chat */}
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:userId" element={<ChatPage />} />

            {/* Payment */}
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />
          </Route>

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
