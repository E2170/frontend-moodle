import { useLanguage } from "./LanguageContext";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { moodlePost, extractCourseImage } from "./moodleApi";
import LoadingSpinner from "./components/LoadingSpinner";

export default function TeacherReports() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  // Öğrenci Notları Modal Durumu
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [studentCompletions, setStudentCompletions] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [activeTab, setActiveTab] = useState('completion'); // 'completion' veya 'grades'

  const fetchCourses = useCallback(async () => {
    const token = localStorage.getItem("moodle_token");
    if (!token || !userInfo) return;

    try {
      const res = await moodlePost(token, "core_enrol_get_users_courses", { userid: userInfo.userid });
      if (Array.isArray(res)) {
        const coursesWithImages = res.map(course => {
          return { ...course, courseimage: extractCourseImage(course, token) };
        });
        setCourses(coursesWithImages);
      }
    } catch (error) {
      console.error("Ders verisi hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const loadCourseReport = async (course) => {
    setSelectedCourse(course);
    setStudentsLoading(true);
    const token = localStorage.getItem("moodle_token");
    try {
      const res = await moodlePost(token, "core_enrol_get_enrolled_users", { courseid: course.id });
      if (Array.isArray(res)) {
        const enrolledStudents = res.filter(u => u.id !== userInfo.userid);
        setStudents(enrolledStudents);
      }
    } catch (e) {
      console.error("Öğrenci listesi alınamadı", e);
    } finally {
      setStudentsLoading(false);
    }
  };

  const viewStudentDetails = async (student) => {
    setSelectedStudent(student);
    setGradesLoading(true);
    setStudentGrades([]);
    setStudentCompletions([]);
    setApiError(null);
    setActiveTab('completion'); // Default to completion first
    
    const token = localStorage.getItem("moodle_token");
    
    try {
      // Özel yazdığımız Moodle proxy API'sine istek atıyoruz:
      // Bu sayede Moodle'ın WS (Web Services) tarafındaki "Moodle Mobile yetkisi" sorunlarına takılmıyoruz.
      const endpoint = import.meta.env.VITE_REST_ENDPOINT || "/api/webservice/rest/server.php";
      // endpoint: "/api/webservice/rest/server.php" 
      // Bizim scriptimiz: "/api/local/get_student_details.php"
      const customApiUrl = endpoint.replace("/webservice/rest/server.php", "/local/get_student_details.php");
      
      const response = await fetch(`${customApiUrl}?wstoken=${token}&courseid=${selectedCourse.id}&userid=${student.id}`);
      if (!response.ok) {
        throw new Error("Moodle sunucusu ile iletişim hatası (HTTP " + response.status + ")");
      }
      
      const data = await response.json();
      
      if (data.error) {
        setApiError(data.error);
      } else {
        // Tamamlama Verilerini Eşle
        if (data.completions) {
          const enrichedStatuses = data.completions.map(comp => ({
            ...comp,
            actualName: comp.name || `${comp.modname} Modülü`,
            state: comp.state // 1,2,3 tamamlandı demek
          }));
          setStudentCompletions(enrichedStatuses);
        }
        
        // Not Verilerini Eşle
        if (data.grades) {
          let totalSum = 0;
          let itemCount = 0;
          
          const validItems = data.grades.map(grade => {
            if (grade.itemtype !== 'course' && grade.itemtype !== 'category') {
               itemCount++;
               const g = parseFloat(grade.finalgrade);
               if (!isNaN(g)) {
                  totalSum += g;
               }
            }
            return {
              displayName: grade.itemname || (grade.itemtype === 'course' ? 'Genel Ortalama' : grade.itemtype),
              gradeformatted: grade.finalgrade || "-",
              percentageformatted: grade.percentage || "-",
              itemtype: grade.itemtype
            };
          });
          
          const courseItem = validItems.find(v => v.itemtype === 'course');
          if (courseItem && itemCount > 0) {
             const avg = (totalSum / itemCount).toFixed(2);
             courseItem.gradeformatted = avg;
             courseItem.percentageformatted = avg + " %";
          }
          
          setStudentGrades(validItems);
        }
      }

    } catch (e) {
      console.error("Öğrenci detayları alınamadı", e);
      setApiError("Sunucuyla iletişim kurulurken bir ağ hatası oluştu.");
    } finally {
      setGradesLoading(false);
    }
  };

  const closeGradesModal = () => {
    setSelectedStudent(null);
    setStudentGrades([]);
    setStudentCompletions([]);
    setApiError(null);
  };

  const formatDate = (unixTimestamp) => {
    if (!unixTimestamp) return "Hiç girmedi";
    return new Date(unixTimestamp * 1000).toLocaleString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" color="blue" className="mb-4" />
        <span className="text-gray-500 font-medium">Raporlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-700 antialiased overflow-y-auto">
      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {selectedCourse && (
              <button 
                onClick={() => setSelectedCourse(null)}
                className="w-10 h-10 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                title="Geri Dön"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              {selectedCourse ? `${selectedCourse.fullname} Raporları` : t.courseReports}
            </h1>
          </div>
        </div>

        {selectedCourse ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Sınıf Listesi ve İlerleme</h2>
                <p className="text-sm text-gray-500 mt-1">Bu derse kayıtlı öğrencilerin genel aktivite durumları</p>
              </div>
              <div className="bg-[#006cb5]/10 text-[#006cb5] font-semibold px-4 py-2 rounded-lg text-sm">
                Toplam {students.length} Öğrenci
              </div>
            </div>

            {studentsLoading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <LoadingSpinner size="md" color="blue" className="mb-3" />
                <span className="text-gray-500">Öğrenciler yükleniyor...</span>
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                Bu derse kayıtlı öğrenci bulunmamaktadır.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 text-sm font-semibold text-gray-600">Öğrenci Adı</th>
                      <th className="p-4 text-sm font-semibold text-gray-600">E-posta</th>
                      <th className="p-4 text-sm font-semibold text-gray-600">{t.lastAccessToCourse}</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {student.fullname.slice(0, 1)}
                            </div>
                            <span className="font-semibold text-gray-800">{student.fullname}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-500">{student.email || "-"}</td>
                        <td className="p-4">
                          <div className="font-medium text-gray-800">{formatDate(student.lastcourseaccess || student.lastaccess)}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Sisteme kayıtlı son işlem</div>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => viewStudentDetails(student)}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-[#006cb5] rounded hover:bg-[#0056b3] transition-colors shadow-sm"
                          >
                            Detayları Gör
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {courses.length === 0 ? (
              <div className="col-span-full p-12 bg-white rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
                Verdiğiniz herhangi bir ders bulunamadı.
              </div>
            ) : (
              courses.map(course => (
                <div key={course.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer flex flex-col" onClick={() => loadCourseReport(course)}>
                  <div className="h-32 bg-gray-100 relative overflow-hidden">
                    {course.courseimage ? (
                      <img src={course.courseimage} alt={course.shortname} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">{course.fullname}</h3>
                    <p className="text-sm text-gray-500 mb-4">{course.shortname}</p>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-red-50 text-red-600 rounded-full">{t.reporting}</span>
                      <span className="text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">{t.viewReport}<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Notlar ve Tamamlama Modalı */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#006cb5]/10 text-[#006cb5] flex items-center justify-center font-bold text-xl">
                    {selectedStudent.fullname.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedStudent.fullname}</h3>
                    <p className="text-sm text-gray-500">Öğrenci İzleme Raporu</p>
                  </div>
                </div>
                <button 
                  onClick={closeGradesModal}
                  className="w-10 h-10 rounded-full hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Sekmeler (Tabs) */}
              <div className="flex border-b border-gray-100 px-6 pt-2 bg-gray-50">
                <button 
                  onClick={() => setActiveTab('completion')}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'completion' ? 'border-[#006cb5] text-[#006cb5]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Aktivite Tamamlama
                </button>
                <button 
                  onClick={() => setActiveTab('grades')}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'grades' ? 'border-[#006cb5] text-[#006cb5]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Sınav ve Ödev Notları
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {gradesLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <LoadingSpinner size="md" color="blue" className="mb-3" />
                    <span className="text-gray-500">Öğrenci verileri Moodle'dan çekiliyor...</span>
                  </div>
                ) : apiError ? (
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{apiError}</span>
                  </div>
                ) : (
                  <>
                    {/* Aktivite Tamamlama Sekmesi */}
                    {activeTab === 'completion' && (
                      studentCompletions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Tamamlanması izlenen herhangi bir aktivite bulunamadı.
                        </div>
                      ) : (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 text-sm font-semibold text-gray-600">{t.activityType}</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Durum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {studentCompletions.map((comp, index) => (
                                <tr key={index} className="hover:bg-gray-50/50">
                                  <td className="p-4">
                                    <span className="font-medium text-gray-800 capitalize">
                                      {comp.actualName}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    {comp.state === 1 || comp.state === 2 ? (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Tamamlandı
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        Tamamlanmadı
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}

                    {/* Notlar Sekmesi */}
                    {activeTab === 'grades' && (
                      studentGrades.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Bu derste öğrencinin notlandırıldığı herhangi bir sınav veya ödev bulunamadı.
                        </div>
                      ) : (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 text-sm font-semibold text-gray-600">Öğe Adı</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">{t.gradeReceived}</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Durum</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {studentGrades.map((grade, index) => {
                                const isTotal = grade.itemtype === 'course';
                                return (
                                  <tr key={grade.id || index} className={`hover:bg-gray-50/50 ${isTotal ? 'bg-blue-50/30' : ''}`}>
                                    <td className="p-4">
                                      <span className={`font-medium ${isTotal ? 'text-[#006cb5] font-bold' : 'text-gray-800'}`}>
                                        {grade.displayName}
                                      </span>
                                    </td>
                                    <td className="p-4 font-semibold text-gray-700">
                                      {grade.gradeformatted === '-' ? 'Not Girilmedi' : grade.gradeformatted}
                                    </td>
                                    <td className="p-4 text-right">
                                      {grade.percentageformatted !== '-' ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          {grade.percentageformatted}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                          Bekliyor
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
