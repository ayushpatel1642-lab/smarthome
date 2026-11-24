import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ToastBanner } from './components/common/ToastBanner';
import { AuthProvider } from './context/AuthContext';
import { HomeProvider } from './context/HomeContext';
import { AddDevicePage } from './pages/AddDevice/AddDevicePage';
import { AutomationPage } from './pages/Automation/AutomationPage';
import { HomeDashboardPage } from './pages/Dashboard/HomeDashboardPage';
import { DesktopDashboardPage } from './pages/DesktopDashboard/DesktopDashboardPage';
import { DeviceDetailPage } from './pages/DeviceDetail/DeviceDetailPage';
import { DevicesPage } from './pages/Devices/DevicesPage';
import { EnergyPage } from './pages/Energy/EnergyPage';
import { LoginPage } from './pages/Login/LoginPage';
import { RuleBuilderPage } from './pages/RuleBuilder/RuleBuilderPage';
import { SecurityPage } from './pages/Security/SecurityPage';
import { SecurityAlertPage } from './pages/SecurityAlert/SecurityAlertPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HomeProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomeDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute>
                  <DevicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/device-detail/:deviceId"
              element={
                <ProtectedRoute>
                  <DeviceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/device-detail"
              element={
                <ProtectedRoute>
                  <DeviceDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-device"
              element={
                <ProtectedRoute>
                  <AddDevicePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/automation"
              element={
                <ProtectedRoute>
                  <AutomationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rule-builder"
              element={
                <ProtectedRoute>
                  <RuleBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rule-builder/:ruleId"
              element={
                <ProtectedRoute>
                  <RuleBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/energy"
              element={
                <ProtectedRoute>
                  <EnergyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security"
              element={
                <ProtectedRoute>
                  <SecurityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security/alert"
              element={
                <ProtectedRoute>
                  <SecurityAlertPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/desktop"
              element={
                <ProtectedRoute>
                  <DesktopDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastBanner />
        </HomeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
