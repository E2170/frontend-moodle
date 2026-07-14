import { useState } from "react";

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      id: 1,
      question: "Sisteme nasıl giriş yapabilirim?",
      answer: "Uzaktan eğitim sistemine öğrenci numaranız ve OBS (Öğrenci Bilgi Sistemi) şifreniz ile giriş yapabilirsiniz. İlk girişte şifrenizi değiştirmeniz istenebilir."
    },
    {
      id: 2,
      question: "Canlı derslere nasıl katılırım?",
      answer: "Derslerim sayfasından ilgili derse tıklayarak ders içeriğine ulaşın. O haftaki haftanın modülü içerisinde yer alan 'Canlı Ders' aktivitesine (Perculus, Zoom veya BigBlueButton) tıklayarak derse anında katılabilirsiniz."
    },
    {
      id: 3,
      question: "Şifremi unuttum, ne yapmalıyım?",
      answer: "Şifrenizi unuttuysanız giriş ekranındaki 'Şifremi Unuttum' bağlantısına tıklayarak kayıtlı e-posta adresinize veya telefon numaranıza sıfırlama bağlantısı isteyebilirsiniz."
    },
    {
      id: 4,
      question: "Online sınav sırasında internetim koptu, ne olacak?",
      answer: "Sınav süreniz bitmediyse, internetiniz geldiğinde sisteme tekrar giriş yapıp sınava kaldığınız yerden devam edebilirsiniz. Ancak süre bitmişse sistem o ana kadar verdiğiniz yanıtları otomatik olarak kaydeder."
    },
    {
      id: 5,
      question: "Ödevimi (Dosya) nasıl yüklerim?",
      answer: "Ders içeriğindeki 'Ödev' aktivitesine tıklayın. Açılan sayfada 'Gönderim Ekle' veya 'Ödev Yükle' butonuna basarak dosyanızı seçin ve 'Değişiklikleri Kaydet' butonuna basın. Kabul edilen dosya uzantılarına (.pdf, .docx vb.) dikkat ediniz."
    },
    {
      id: 6,
      question: "Ders içeriklerini cihazıma indirebilir miyim?",
      answer: "Öğretim görevlisinin izin verdiği PDF, PowerPoint ve benzeri dosyaları indirebilirsiniz. Ancak canlı ders kayıtları telif hakları gereği genellikle sadece sistem üzerinden izlenebilir."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 antialiased flex flex-col">
      <main className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 py-8 flex-1">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-[#0056b3] to-[#003d82] rounded-[16px] p-8 sm:p-12 text-center shadow-lg mb-8 text-white">
          <h1 className="text-3xl font-bold mb-4">Size nasıl yardımcı olabiliriz?</h1>
          <p className="text-blue-100 text-[15px] max-w-xl mx-auto mb-8">
            Uzaktan eğitim sistemiyle ilgili sıkça sorulan sorulara göz atabilir veya aradığınız konuyu hızlıca bulabilirsiniz.
          </p>
          <div className="relative max-w-2xl mx-auto">
            <svg className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Sorunuzu buraya yazın (Örn: Sınav, Canlı Ders, Şifre)..." 
              className="w-full pl-12 pr-4 py-4 rounded-full text-[#212529] focus:outline-none focus:ring-4 focus:ring-blue-300 transition-shadow text-[15px] shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <h2 className="text-[20px] font-bold text-[#212529] mb-4">Sıkça Sorulan Sorular (SSS)</h2>
            <div className="bg-white border border-[#e9ecef] rounded-[12px] shadow-sm overflow-hidden">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div key={faq.id} className={`border-b border-[#e9ecef] last:border-0`}>
                    <button 
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-[15px] text-[#212529] pr-8">{faq.question}</span>
                      <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${openFaq === faq.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="px-6 pb-5 pt-1 text-[14px] text-gray-600 leading-relaxed bg-gray-50/50">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-[15px]">
                  Aradığınız kriterlere uygun bir yardım içeriği bulunamadı.
                </div>
              )}
            </div>
          </div>

          {/* Contact Support Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#e9ecef] rounded-[12px] p-6 shadow-sm sticky top-6">
              <div className="w-12 h-12 bg-blue-50 text-[#0056b3] rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#212529] mb-2">Destek İhtiyacınız mı var?</h3>
              <p className="text-[14px] text-gray-600 mb-6 leading-relaxed">
                Eğer SSS bölümünde aradığınız cevabı bulamadıysanız veya teknik bir problem yaşıyorsanız doğrudan destek ekibimizle iletişime geçebilirsiniz.
              </p>
              
              <div className="space-y-4">
                <a href="#" className="flex items-center gap-3 text-[14px] font-medium text-[#0056b3] hover:text-[#003d82] transition-colors p-3 bg-blue-50 rounded-[8px]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  destek@akuzem.edu.tr
                </a>
                <a href="#" className="flex items-center gap-3 text-[14px] font-medium text-[#0056b3] hover:text-[#003d82] transition-colors p-3 bg-blue-50 rounded-[8px]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  0(850) 123 45 67
                </a>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
