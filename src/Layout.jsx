import { Outlet, Navigate } from "react-router-dom";
import Header from "./Header";
import { useAuth } from "./AuthContext";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased overflow-hidden flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
