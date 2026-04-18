import { Navigate } from "react-router-dom";

// Index simply redirects to the dashboard. App.tsx already routes "/" to /dashboard.
const Index = () => <Navigate to="/dashboard" replace />;
export default Index;
