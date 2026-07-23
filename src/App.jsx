import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import ErrorBoundary from "./ErrorBoundary";
import AlertModal from "./AlertModal";
import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";

// Sayfaları dinamik (lazy) yükle - İlk yükleme (Initial Load) hızını artırır
const LoginPage = React.lazy(() => import("./LoginPage"));
const Dashboard = React.lazy(() => import("./Dashboard"));
const CourseDetail = React.lazy(() => import("./CourseDetail"));
const Calendar = React.lazy(() => import("./Calendar"));
const Grades = React.lazy(() => import("./Grades"));
const MyCourses = React.lazy(() => import("./MyCourses"));
const Forum = React.lazy(() => import("./Forum"));
const Messages = React.lazy(() => import("./Messages"));
const Announcements = React.lazy(() => import("./Announcements"));
const Help = React.lazy(() => import("./Help"));
const TeacherDashboard = React.lazy(() => import("./TeacherDashboard"));
const TeacherCalendar = React.lazy(() => import("./TeacherCalendar"));
const TeacherQuestionBank = React.lazy(() => import("./TeacherQuestionBank"));
const TeacherFiles = React.lazy(() => import("./TeacherFiles"));
const TeacherReports = React.lazy(() => import("./TeacherReports"));
const TeacherCoursePage = React.lazy(() => import("./TeacherCoursePage"));
const TeacherCourses = React.lazy(() => import("./TeacherCourses"));

function App() {
  return (
    <AuthProvider>
      <Router>
        <AlertModal />
        <Suspense fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col">
            <LoadingSpinner size="lg" color="blue" className="mb-4" />
            <div className="text-gray-500 font-medium animate-pulse">
              AKUZEM Yükleniyor...
            </div>
          </div>
        }>
          <Routes>
          {/* Ana dizin (/) giriş sayfasını gösterir */}
          <Route path="/" element={<LoginPage />} />

          {/* Korunan Rotalar */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* /teacher dizini öğretmen panelini gösterir */}
              <Route element={<ProtectedRoute allowedRole="teacher" />}>
                <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
                <Route path="/teacher-calendar" element={<TeacherCalendar />} />
                <Route path="/teacher-question-bank" element={<TeacherQuestionBank />} />
                <Route path="/teacher-files" element={<TeacherFiles />} />
                <Route path="/teacher-reports" element={<TeacherReports />} />
                <Route path="/teacher-courses" element={<TeacherCourses />} />
                <Route path="/teacher-course/:courseId" element={<TeacherCoursePage />} />
              </Route>

              {/* /dashboard dizini öğrenci panelini gösterir */}
              <Route element={<ProtectedRoute allowedRole="student" />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/course/:courseId" element={<CourseDetail />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/grades" element={<Grades />} />
                <Route path="/mycourse" element={<MyCourses />} />
              </Route>

              {/* Ortak rotalar */}
              <Route path="/forum" element={<Forum />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/help" element={<Help />} />
            </Route>
          </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
