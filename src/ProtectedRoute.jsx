import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ allowedRole }) {
  const { token, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0056b3] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    // If a teacher tries to access a student route, or vice versa
    return <Navigate to={userRole === "teacher" ? "/teacher-dashboard" : "/dashboard"} replace />;
  }

  return <Outlet />;
}
