import "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "./Layout";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import CourseDetail from "./CourseDetail";
import Calendar from "./Calendar";
import Grades from "./Grades";
import MyCourses from "./MyCourses";
import Forum from "./Forum";
import Messages from "./Messages";
import Announcements from "./Announcements";
import Help from "./Help";
import TeacherDashboard from "./TeacherDashboard";
import TeacherCalendar from "./TeacherCalendar";
import TeacherQuestionBank from "./TeacherQuestionBank";
import TeacherFiles from "./TeacherFiles";
import TeacherReports from "./TeacherReports";
import TeacherCoursePage from "./TeacherCoursePage";
import TeacherCourses from "./TeacherCourses";

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;
