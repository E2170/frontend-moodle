import { useLanguage } from "./LanguageContext";

export default function NetworkError({ onRetry, message }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#fcfcfc] rounded-[12px]">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-[#e9ecef]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#212529] mb-2">{t.serverErrorTitle || "Bağlantı Hatası"}</h3>
        <p className="text-[#6c757d] mb-8 leading-relaxed">
          {message || t.serverErrorMessage || "Sunucuya şu an ulaşılamıyor veya bağlantı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin."}
        </p>
        <button
          onClick={() => {
            if (onRetry) onRetry();
            else window.location.reload();
          }}
          className="w-full bg-[#1e88e5] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#1565c0] transition-colors focus:ring-4 focus:ring-[#bbdefb] focus:outline-none"
        >
          {t.retryButton || "Tekrar Dene"}
        </button>
      </div>
    </div>
  );
}
