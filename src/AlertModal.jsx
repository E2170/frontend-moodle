import { useEffect, useState } from 'react';

export const showAlert = (message) => {
    window.dispatchEvent(new CustomEvent('show-custom-alert', { detail: message }));
};

export default function AlertModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const handleShow = (e) => {
            setMessage(e.detail);
            setIsOpen(true);
        };
        window.addEventListener('show-custom-alert', handleShow);
        return () => window.removeEventListener('show-custom-alert', handleShow);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all scale-100" style={{ animation: 'zoomIn 0.2s ease-out' }}>
                <div className="p-5 flex items-center gap-4 bg-gradient-to-r from-slate-50 to-white border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0 shadow-inner">
                        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-800 tracking-tight">Sistem Uyarısı</h3>
                </div>
                
                <div className="p-6 text-[15px] text-gray-600 font-medium leading-relaxed">
                    {message}
                </div>
                
                <div className="p-4 bg-gray-50 flex justify-end border-t border-gray-100">
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                    >
                        Anladım
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
