import { useNavigate } from "react-router-dom";

export default function CourseCard({ course }) {
  const navigate = useNavigate();

  const getCourseInitials = (fullname) => {
    if (!fullname) return "DS";
    const words = fullname.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return fullname.slice(0, 2).toUpperCase();
  };

  const progress = course.calculatedProgress !== undefined && course.calculatedProgress !== null
    ? Math.round(course.calculatedProgress)
    : (course.progress !== undefined && course.progress !== null 
        ? Math.round(course.progress) 
        : 0);

  return (
    <div 
      onClick={() => navigate(`/course/${course.id}`)} 
      className="bg-white rounded-[8px] border border-[#e9ecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-[#ced4da] transition-all cursor-pointer h-[150px] flex flex-col justify-between overflow-hidden relative group"
    >
      <div className="p-4 flex-1">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold text-[#6c757d] bg-[#f8f9fa] px-1.5 py-0.5 rounded">
            {course.shortname || "DERS"}
          </span>
          
          <div className="relative">
            <svg width="36" height="36" className="transform -rotate-90">
              <circle cx="18" cy="18" r="16" stroke="#e9ecef" strokeWidth="3" fill="none" />
              <circle 
                cx="18" 
                cy="18" 
                r="16" 
                stroke="#28a745" 
                strokeWidth="3" 
                fill="none" 
                strokeDasharray="100.5" 
                strokeDashoffset={100.5 - (progress / 100) * 100.5} 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#28a745]">
              <span className="text-[7px]">%</span>{progress}
            </div>
          </div>

        </div>
        <h3 className="text-[13px] font-bold text-[#212529] leading-tight pr-10 line-clamp-2 mt-1">
          {course.fullname}
        </h3>
      </div>
      <div className="flex justify-between items-center px-4 pb-4 mt-auto">
        <div className="w-[26px] h-[26px] rounded-full bg-[#945cbf] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
          {getCourseInitials(course.fullname)}
        </div>

      </div>
    </div>
  );
}
