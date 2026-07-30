const fs = require('fs');
const path = require('path');

const extracted = JSON.parse(fs.readFileSync('extracted_texts.json', 'utf8'));

// We will map Turkish text to English and Arabic, and create a camelCase key.
const dict = {};

function toCamelCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

const manualTranslations = {
  "+ Aktivite Ekle": { en: "+ Add Activity", ar: "+ إضافة نشاط", key: "addActivityBtn" },
  "+ Duyuru Ekle": { en: "+ Add Announcement", ar: "+ إضافة إعلان", key: "addAnnouncementBtn" },
  "+ Yeni Soru": { en: "+ New Question", ar: "+ سؤال جديد", key: "newQuestionBtn" },
  "Aktivite Listesine Dön": { en: "Back to Activity List", ar: "العودة لقائمة الأنشطة", key: "backToActivityList" },
  "Aktivite Tamamlama": { en: "Activity Completion", ar: "إكمال النشاط", key: "activityCompletion" },
  "Aktivite Tipi": { en: "Activity Type", ar: "نوع النشاط", key: "activityTypeLabel" },
  "Aktivite İsmi": { en: "Activity Name", ar: "اسم النشاط", key: "activityName" },
  "Aktivitelerim": { en: "My Activities", ar: "أنشطتي", key: "myActivities" },
  "Aktiviteyi Sil": { en: "Delete Activity", ar: "حذف النشاط", key: "deleteActivity" },
  "Alınan Not": { en: "Grade Received", ar: "الدرجة المستلمة", key: "gradeReceived" },
  "App Store": { en: "App Store", ar: "متجر التطبيقات", key: "appStore" },
  "Ara": { en: "Search", ar: "بحث", key: "searchBtn" },
  "BUGÜN": { en: "TODAY", ar: "اليوم", key: "today" },
  "Başarıyla Eklendi!": { en: "Added Successfully!", ar: "تمت الإضافة بنجاح!", key: "addedSuccessfully" },
  "Başarıyla Yüklendi!": { en: "Uploaded Successfully!", ar: "تم الرفع بنجاح!", key: "uploadedSuccessfully" },
  "Bekliyor": { en: "Waiting", ar: "قيد الانتظار", key: "waiting" },
  "Bildirimler": { en: "Notifications", ar: "الإشعارات", key: "notifications" },
  "Ders": { en: "Course", ar: "الدورة", key: "courseLabel" },
  "Ders Başlangıç Zamanı": { en: "Course Start Time", ar: "وقت بدء الدورة", key: "courseStartTime" },
  "Ders Bitiş Zamanı": { en: "Course End Time", ar: "وقت نهاية الدورة", key: "courseEndTime" },
  "Ders Durumu": { en: "Course Status", ar: "حالة الدورة", key: "courseStatusLabel" },
  "Ders Programı": { en: "Course Schedule", ar: "جدول الدورة", key: "courseSchedule" },
  "Ders Seçiniz": { en: "Select Course", ar: "اختر الدورة", key: "selectCourse" },
  "Ders Tamamlama": { en: "Course Completion", ar: "إكمال الدورة", key: "courseCompletion" },
  "Ders İsmi": { en: "Course Name", ar: "اسم الدورة", key: "courseNameLabel" },
  "Ders İçeriği": { en: "Course Content", ar: "محتوى الدورة", key: "courseContent" },
  "Derse Duyuru Ekle": { en: "Add Announcement to Course", ar: "إضافة إعلان للدورة", key: "addAnnouncementToCourse" },
  "Derse Son Erişim": { en: "Last Access to Course", ar: "آخر دخول للدورة", key: "lastAccessToCourse" },
  "Dersler": { en: "Courses", ar: "الدورات", key: "coursesList" },
  "Detayları Gör": { en: "View Details", ar: "عرض التفاصيل", key: "viewDetails" },
  "Detaylı Arama": { en: "Detailed Search", ar: "بحث مفصل", key: "detailedSearch" },
  "Devam et": { en: "Continue", ar: "متابعة", key: "continueBtn" },
  "Dosya": { en: "File", ar: "ملف", key: "file" },
  "Dosya Adı": { en: "File Name", ar: "اسم الملف", key: "fileName" },
  "Dosya Boyutu": { en: "File Size", ar: "حجم الملف", key: "fileSize" },
  "Dosya Tipi": { en: "File Type", ar: "نوع الملف", key: "fileType" },
  "Dosya Yükle": { en: "Upload File", ar: "رفع ملف", key: "uploadFile" },
  "Duyuru Ekle": { en: "Add Announcement", ar: "إضافة إعلان", key: "addAnnouncement" },
  "Dönem": { en: "Term", ar: "الفصل الدراسي", key: "termLabel" },
  "Erişim Kısıtlamaları": { en: "Access Restrictions", ar: "قيود الوصول", key: "accessRestrictions" },
  "Evet, Sil": { en: "Yes, Delete", ar: "نعم، احذف", key: "yesDelete" },
  "Eğitmen": { en: "Teacher", ar: "معلم", key: "teacherRole" },
  "Final": { en: "Final", ar: "نهائي", key: "finalExam" },
  "Forum": { en: "Forum", ar: "منتدى", key: "forumLabel" },
  "Genel Ayarlar": { en: "General Settings", ar: "إعدادات عامة", key: "generalSettings" },
  "Gönder": { en: "Submit", ar: "إرسال", key: "submitBtn" },
  "Görüntüle": { en: "View", ar: "عرض", key: "viewBtn" },
  "Hata": { en: "Error", ar: "خطأ", key: "errorTitle" },
  "Hayır, İptal": { en: "No, Cancel", ar: "لا، إلغاء", key: "noCancel" },
  "İndir": { en: "Download", ar: "تحميل", key: "download" },
  "İptal": { en: "Cancel", ar: "إلغاء", key: "cancelBtn" },
  "Kapat": { en: "Close", ar: "إغلاق", key: "closeBtn" },
  "Kaydet": { en: "Save", ar: "حفظ", key: "saveBtn" },
  "Listeye Dön": { en: "Back to List", ar: "العودة للقائمة", key: "backToList" },
  "Lütfen Bekleyiniz...": { en: "Please Wait...", ar: "يرجى الانتظار...", key: "pleaseWaitDots" },
  "Mesaj": { en: "Message", ar: "رسالة", key: "message" },
  "Mesaj Gönder": { en: "Send Message", ar: "إرسال رسالة", key: "sendMessage" },
  "Sınav": { en: "Exam", ar: "اختبار", key: "examType" },
  "Tarih": { en: "Date", ar: "التاريخ", key: "date" },
  "Tamamlandı": { en: "Completed", ar: "مكتمل", key: "completed" },
  "Yeni Ekle": { en: "Add New", ar: "إضافة جديد", key: "addNewBtn" },
  "Ödev": { en: "Assignment", ar: "واجب", key: "assignmentType" },
  "Öğrenci": { en: "Student", ar: "طالب", key: "studentRole" }
};

const processed = Object.entries(manualTranslations).map(([trStr, vals]) => {
  return { tr: trStr, en: vals.en, ar: vals.ar, key: vals.key };
});

fs.writeFileSync('translations_mapping.json', JSON.stringify(processed, null, 2));
console.log(`Generated mapping with ${processed.length} entries.`);
