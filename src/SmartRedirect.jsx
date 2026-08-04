import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function SmartRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const courseId = searchParams.get("courseId") || searchParams.get("courseid");
    const cmid = searchParams.get("cmid") || searchParams.get("id");

    if (courseId) {
      if (user?.role === "teacher") {
        navigate(`/teacher-course/${courseId}${cmid ? `?cmid=${cmid}` : ""}`, { replace: true });
      } else {
        navigate(`/course/${courseId}${cmid ? `?cmid=${cmid}` : ""}`, { replace: true });
      }
    } else {
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate, user]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#006cb5] rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}
