import React, { useState } from "react";

export function AlmsQuizActivityModal({ onClose, onOpenSession, onSaveActivity }) {
  const [activeTab, setActiveTab] = useState("İÇERİK");
  const [form, setForm] = useState({ name: "", intro: "", examNote: "", start: "", end: "" });

  const TABS = ["ŞUBE SEÇİMİ", "İÇERİK", "AYARLAR", "OTURUMLAR"];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-[450px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Sınav Aktivitesi Ekle
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto shrink-0">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-2 text-[10px] font-bold tracking-wider text-center border-b-[3px] transition-colors whitespace-nowrap ${
                activeTab === tab ? "border-blue-500 text-blue-600 bg-blue-50/30" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === "İÇERİK" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Aktivite İsmi <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 ring-blue-100 transition-all" />
                <p className="text-[10px] text-gray-400 mt-1">Aktivite listeleme sayfalarında ve Not Defteri'nde yazdığınız şekli ile görünecektir.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Eğitmen Notu</label>
                <textarea value={form.intro} onChange={e=>setForm({...form, intro: e.target.value})} rows={4} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 ring-blue-100 transition-all resize-none" placeholder="Eğitmen Notu"></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sınav Notu</label>
                <textarea value={form.examNote} onChange={e=>setForm({...form, examNote: e.target.value})} rows={4} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 ring-blue-100 transition-all resize-none" placeholder="Sınav Notu"></textarea>
              </div>
              <button onClick={() => setActiveTab("AYARLAR")} className="w-full bg-[#0b1b36] text-white py-3 rounded-md font-bold text-sm hover:bg-black transition-colors shadow-sm mt-4">
                Sonraki Adım: Ayarlar
              </button>
            </div>
          )}

          {activeTab === "OTURUMLAR" && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 text-4xl shadow-inner border border-green-100">
                🚀
              </div>
              <div className="max-w-[280px]">
                <h3 className="font-bold text-gray-800 text-lg">Sınavı Yayımla</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Sınavın ön atamasını yapıp ders sayfasına ekleyin. Soru ekleme işlemlerini daha sonra yapabilirsiniz.
                </p>
              </div>
              <button onClick={() => onSaveActivity(form)} className="mt-4 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Sınavın Ön Atamasını Yap ve Yayımla
              </button>
            </div>
          )}

          {activeTab === "AYARLAR" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-2">Sınavın Açılacağı Tarih & Saat <span className="text-red-500">*</span></label>
                 <input type="datetime-local" value={form.start} onChange={e => setForm({...form, start: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-blue-500 outline-none text-gray-700 shadow-sm transition-all focus:ring-2 ring-blue-100" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-2">Sınavın Biteceği Tarih & Saat <span className="text-red-500">*</span></label>
                 <input type="datetime-local" value={form.end} onChange={e => setForm({...form, end: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-blue-500 outline-none text-gray-700 shadow-sm transition-all focus:ring-2 ring-blue-100" />
               </div>
               <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                 Belirttiğiniz tarihler dışında sınav erişime kapalı olacaktır. Öğrenciler bu saat aralığında sınava giriş yapabilirler.
               </p>
               <button onClick={() => setActiveTab("OTURUMLAR")} className="w-full bg-[#0b1b36] text-white py-3 rounded-md font-bold text-sm hover:bg-black transition-colors shadow-sm mt-6">
                 Sonraki Adım: Oturumlar
               </button>
            </div>
          )}

          {activeTab === "ŞUBE SEÇİMİ" && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
               <div className="text-4xl mb-3">👥</div>
               <div className="text-sm font-bold text-gray-600">Şube Seçimi yakında eklenecektir.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export function AlmsSessionWizard({ onClose, onComplete, initialName }) {
  const [step, setStep] = useState(1);
  const [sessionInfo, setSessionInfo] = useState({ name: initialName || "sınav", start: "2026-07-09T12:00", end: "2026-07-10T11:00" });
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // mock bank
  const questionBank = [
    { id: 1, name: "Python Listeleri", text: "<p>Python'da liste eleman eklemek için hangi metot kullanılır?</p>", difficulty: "Kolay", type: "Çoktan Seçmeli" },
    { id: 2, name: "Ağ Temelleri", text: "<p>Ağ nedir?</p>", difficulty: "Orta", type: "Çoktan Tek Seçmeli" },
    { id: 3, name: "İşletim Sistemleri", text: "<p>Aşağıdakilerden hangisi bir işletim sistemi değildir?</p>", difficulty: "Kolay", type: "Çoktan Seçmeli" },
    { id: 4, name: "React Sürümleri", text: "<p>React hook'ları hangi versiyonda gelmiştir?</p>", difficulty: "Zor", type: "Çoktan Tek Seçmeli" },
  ];

  const STEPS = [
    "OTURUM BİLGİLERİ", "SORU EKLE", "SINAV SORULARI", "ATANAN ÖĞRENCİLER", "ÖĞRENCİ ATAMA", "GÜVENLİK", "YAYIMLA"
  ];

  const toggleQuestion = (id) => {
    setSelectedQuestions(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
       setIsPublishing(false);
       onComplete(sessionInfo, selectedQuestions);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#f8fafc] flex flex-col animate-in fade-in duration-200">
       {/* Header */}
       <div className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center shrink-0 shadow-sm">
         <div className="w-8"></div>
         <h2 className="text-base font-bold text-gray-800 tracking-tight">Sınav Oturumu Ayarları</h2>
         <button onClick={onClose} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-md p-1.5 transition-colors">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
       </div>

       {/* Tabs */}
       <div className="bg-white border-b border-gray-200 px-4 flex items-center justify-between overflow-x-auto shrink-0 shadow-sm relative">
         <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-200"></div>
         {STEPS.map((s, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            let label = `${s} ${stepNum}/7`;
            if (stepNum === 3) label = `SINAV SORULARI(${selectedQuestions.length}) 3/7`;
            if (stepNum === 4) label = `ATANAN ÖĞRENCİLER(27) 4/7`;
            return (
              <button key={i} onClick={() => setStep(stepNum)}
                className={`py-4 px-4 text-[11px] font-bold tracking-wide whitespace-nowrap border-b-[3px] transition-all relative z-10 ${
                  isActive ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-700"
                }`}>
                {label}
              </button>
            )
         })}
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start">
          <div className="w-full max-w-5xl">
            {step === 1 && (
               <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sınav Notlandırma Tipi</label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-blue-500 outline-none text-gray-700 bg-gray-50">
                        <option>Son Giriş Notu</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Oturum Adı</label>
                      <input type="text" value={sessionInfo.name} onChange={e => setSessionInfo({...sessionInfo, name: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-blue-500 outline-none text-gray-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sınavın Açılacağı Tarih & Saat</label>
                         <input type="datetime-local" value={sessionInfo.start} onChange={e => setSessionInfo({...sessionInfo, start: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-blue-500 outline-none text-gray-700" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sınavın Biteceği Tarih & Saat</label>
                         <input type="datetime-local" value={sessionInfo.end} onChange={e => setSessionInfo({...sessionInfo, end: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:border-blue-500 outline-none text-gray-700" />
                       </div>
                    </div>
                    <div className="flex items-center gap-3 pt-6 pb-2">
                      <span className="text-sm font-bold text-gray-700">Otomatik Kaydı Devreye Al</span>
                      <div className="w-10 h-6 bg-green-500 rounded-full flex items-center p-1 justify-end cursor-pointer shadow-inner">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-gray-100">
                      <button onClick={() => setStep(2)} className="bg-[#0b1b36] hover:bg-black text-white px-8 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 shadow-sm transition-colors">
                        Kaydet
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
               </div>
            )}

            {step === 2 && (
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="grid grid-cols-3 gap-5 mb-6">
                    {["Anahtar Kelime Seçiniz", "Kategori Seçiniz", "Konu Başlığı Seçiniz", "Ana Ders Seçiniz", "Ders Seçiniz", "Dönem Seçiniz"].map(label => (
                      <div key={label}>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                        <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none bg-white text-gray-600 focus:border-blue-500 transition-colors">
                          <option>{label}</option>
                        </select>
                      </div>
                    ))}
                 </div>
                 <div className="flex justify-end mb-8 border-b border-gray-100 pb-6">
                    <button className="bg-[#0b1b36] hover:bg-[#1a2b4c] text-white px-8 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 shadow-sm transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      Ara
                    </button>
                 </div>
                 
                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                   <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-4">
                     <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" onChange={(e) => setSelectedQuestions(e.target.checked ? questionBank.map(q=>q.id) : [])} checked={selectedQuestions.length > 0 && selectedQuestions.length === questionBank.length} />
                     <span className="text-sm text-gray-700 font-bold">Tümünü seç</span>
                   </div>
                   <div className="divide-y divide-gray-100">
                     {questionBank.map(q => (
                       <div key={q.id} className="p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                         <div className="flex items-center gap-4 flex-1">
                           <input type="checkbox" checked={selectedQuestions.includes(q.id)} onChange={() => toggleQuestion(q.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                           <div className="flex flex-col">
                             <span className="text-[13px] font-bold text-gray-800">{q.name}</span>
                             <div className="text-[11px] text-gray-500 font-medium line-clamp-2" dangerouslySetInnerHTML={{__html: q.text}}></div>
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <span className="bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded text-[11px] font-bold shadow-sm">{q.difficulty}</span>
                           <span className="bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1 rounded text-[11px] font-bold shadow-sm">{q.type}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 <div className="flex justify-center items-center gap-6 mt-8 text-gray-400">
                    <span className="cursor-pointer hover:text-gray-600 font-bold">&laquo;</span>
                    <span className="cursor-pointer hover:text-gray-600 font-bold">&lsaquo;</span>
                    <span className="text-sm font-bold text-gray-600">1 - 4 / 4</span>
                    <span className="cursor-pointer hover:text-gray-600 font-bold">&rsaquo;</span>
                    <span className="cursor-pointer hover:text-gray-600 font-bold">&raquo;</span>
                 </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                   <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-4">
                     <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" readOnly checked={selectedQuestions.length > 0} />
                     <span className="text-sm text-gray-700 font-bold">Tümünü seç</span>
                   </div>
                   <div className="divide-y divide-gray-100">
                     {questionBank.filter(q => selectedQuestions.includes(q.id)).map(q => (
                       <div key={q.id} className="p-4 flex items-center justify-between group">
                         <div className="flex items-center gap-4 flex-1">
                           <div className="flex flex-col">
                             <span className="text-[13px] font-bold text-gray-800">{q.name}</span>
                             <div className="text-[11px] text-gray-500 font-medium line-clamp-2" dangerouslySetInnerHTML={{__html: q.text}}></div>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <span className="bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded text-[11px] font-bold shadow-sm">{q.difficulty}</span>
                           <span className="bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1 rounded text-[11px] font-bold shadow-sm">{q.type}</span>
                           <button 
                             onClick={() => toggleQuestion(q.id)}
                             className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                             title="Soruyu Sınavdan Çıkar"
                           >
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                         </div>
                       </div>
                     ))}
                     {selectedQuestions.length === 0 && (
                       <div className="p-12 text-center flex flex-col items-center justify-center">
                         <div className="text-4xl mb-4 opacity-50">📂</div>
                         <div className="text-gray-500 text-sm font-bold">Henüz soru seçmediniz.</div>
                         <div className="text-gray-400 text-xs mt-1">SORU EKLE sekmesinden soru seçebilirsiniz.</div>
                         <button onClick={() => setStep(2)} className="mt-4 text-blue-600 hover:underline text-sm font-bold">Soru Ekle'ye Git</button>
                       </div>
                     )}
                   </div>
                 </div>
              </div>
            )}

            {(step === 4 || step === 5 || step === 6) && (
              <div className="flex flex-col items-center justify-center py-32 opacity-60 animate-in fade-in zoom-in duration-300">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-4 border border-gray-200">🚧</div>
                 <p className="text-xl font-bold text-gray-600 tracking-tight">Bu adım yapılandırılıyor</p>
                 <p className="text-sm text-gray-400 mt-2">Bu simülasyonda Soru Ekleme ve Yayımlama adımlarına odaklanılmıştır.</p>
              </div>
            )}

            {step === 7 && (
              <div className="grid grid-cols-[1fr_400px] gap-12 items-center animate-in fade-in slide-in-from-bottom-4 duration-300 pt-10">
                 <div className="space-y-8 relative pl-6">
                    <div className="absolute left-[9px] top-[10px] bottom-[10px] w-0.5 bg-gray-200"></div>
                    {[
                      { text: "Oturuma en az 1 soru eklenmiş olmalı", ok: selectedQuestions.length > 0 },
                      { text: "Oturumdaki soru sayısı , sınavdaki soru sayısına eşit veya daha fazla olmalı", ok: true },
                      { text: "Oturum başlangıç tarihi bitiş tarihinden önce olmalı", ok: true },
                      { text: "Oturum bitiş tarihi geçmiş olmamalı", ok: true },
                      { text: "Oturum en az bir öğrenci içerir", ok: true },
                      { text: "Soru Puan Dağılımı 100 Puana Eşit Olmalı", ok: true },
                      { text: "Sınavın ön ataması yapılmalı 0/27", ok: false }
                    ].map((cond, i) => (
                      <div key={i} className="flex items-center gap-5 relative">
                        <div className={`absolute -left-[30px] w-4 h-4 rounded-full border-[3px] z-10 ${cond.ok ? "border-emerald-500 bg-white" : "border-red-500 bg-white"}`}></div>
                        <span className={`text-sm font-bold tracking-wide ${cond.ok ? "text-emerald-500" : "text-red-500"}`}>{cond.text}</span>
                      </div>
                    ))}
                 </div>
                 
                 <div className="bg-red-50/50 border border-red-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center h-full shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-200"></div>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-500 text-2xl shadow-sm mb-4 border border-red-100">
                      ⚠️
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight">Sınavın ön ataması<br/>yapılmalı</h3>
                    <p className="text-xs text-gray-500 mb-8 px-4">Sınavı yayınlayabilmek için ön atamayı tamamlayınız.</p>
                    <button onClick={handlePublish} disabled={isPublishing} className="w-full bg-[#0b1b36] hover:bg-black text-white py-3.5 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2">
                      {isPublishing ? (
                         <>
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           Yayınlanıyor...
                         </>
                      ) : <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Ön atama yap ve yayımla
                      </>}
                    </button>
                 </div>
              </div>
            )}
          </div>
       </div>
    </div>
  );
}
