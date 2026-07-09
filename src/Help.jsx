import React from "react";
import Header from "./Header";

export default function Help() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans text-[#495057] antialiased flex flex-col">
      <Header />
      <main className="max-w-[1200px] w-full mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <h2 className="text-[22px] font-medium text-[#212529]">Yardım Merkezi</h2>
        </div>
        <div className="bg-white border border-[#e9ecef] rounded-[10px] p-12 text-center text-gray-500 font-medium shadow-sm flex flex-col items-center">
            <div className="w-[180px] h-[180px] bg-[#f1f3f5] rounded-full flex items-center justify-center mb-6 relative">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-[15px] font-semibold text-[#212529]">
              Yardım içerikleri çok yakında burada olacak.
            </p>
        </div>
      </main>
    </div>
  );
}
