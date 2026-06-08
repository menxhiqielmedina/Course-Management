import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound.tsx";
import { registerAuthCallbacks } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetails = lazy(() => import("./pages/CourseDetails"));
const Students = lazy(() => import("./pages/Students"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const Professors = lazy(() => import("./pages/Professors"));
const ProfessorProfile = lazy(() => import("./pages/ProfessorProfile"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Assignments = lazy(() => import("./pages/Assignments"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Reports = lazy(() => import("./pages/Reports"));
const Files = lazy(() => import("./pages/Files"));
const CMS = lazy(() => import("./pages/CMS"));
const Audit = lazy(() => import("./pages/Audit"));
const Settings = lazy(() => import("./pages/Settings"));
const Signup = lazy(() => import("./pages/Signup"));
const PendingApprovals = lazy(() => import("./pages/admin/PendingApprovals"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Grades = lazy(() => import("./pages/Grades"));


const queryClient = new QueryClient();

const Loader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const AppInit = () => {
  const setToken = useAppStore((s) => s.setToken);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    // Token is never persisted to localStorage — it lives in memory only.
    // On page reload the 401 interceptor will silently refresh it via the HttpOnly cookie.
    registerAuthCallbacks(
      (newToken) => setToken(newToken),
      () => {
        logout();
        window.location.replace("/login");
      }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInit />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/:id" element={<StudentProfile />} />
              <Route path="/professors" element={<Professors />} />
              <Route path="/professors/:id" element={<ProfessorProfile />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/files" element={<Files />} />
              <Route path="/cms" element={<CMS />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/pending" element={<PendingApprovals />} />
              <Route path="/grades" element={<Grades />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;