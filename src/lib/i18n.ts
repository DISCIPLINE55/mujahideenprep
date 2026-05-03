import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "Students": "Students",
      "Teachers": "Teachers",
      "Classes": "Classes",
      "Subjects": "Subjects",
      "Attendance": "Attendance",
      "Results": "Results",
      "Fees": "Fees",
      "Timetable": "Timetable",
      "Notifications": "Notifications",
      "Calendar": "Calendar",
      "Library": "Library",
      "Communications": "Communications",
      "Reports": "Reports",
      "AI Assistant": "AI Assistant",
      "Settings": "Settings",
      "Logout": "Logout",
      "Profile": "Profile",
      "Search": "Search...",
      "Language": "Language"
    }
  },
  ar: {
    translation: {
      "Dashboard": "لوحة القيادة",
      "Students": "الطلاب",
      "Teachers": "المعلمون",
      "Classes": "الفصول",
      "Subjects": "المواد",
      "Attendance": "الحضور",
      "Results": "النتائج",
      "Fees": "الرسوم",
      "Timetable": "الجدول الزمني",
      "Notifications": "الإشعارات",
      "Calendar": "التقويم",
      "Library": "المكتبة",
      "Communications": "الاتصالات",
      "Reports": "التقارير",
      "AI Assistant": "المساعد الذكي",
      "Settings": "الإعدادات",
      "Logout": "تسجيل خروج",
      "Profile": "الملف الشخصي",
      "Search": "بحث...",
      "Language": "اللغة"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: typeof window !== 'undefined' ? localStorage.getItem('mpsms_lang') || 'en' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Handle RTL direction
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    localStorage.setItem('mpsms_lang', lng);
  }
});

export default i18n;
