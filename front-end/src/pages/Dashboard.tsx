import { useAppStore } from "@/store/useAppStore";
import AdminDashboard from "./dashboards/AdminDashboard";
import ProfessorDashboard from "./dashboards/ProfessorDashboard";
import StudentDashboard from "./dashboards/StudentDashboard";

const Dashboard = () => {
  const role = useAppStore((s) => s.user?.role);
  if (role === "professor") return <ProfessorDashboard />;
  if (role === "student") return <StudentDashboard />;
  return <AdminDashboard />;
};

export default Dashboard;
