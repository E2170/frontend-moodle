export default function ActivityPanel({ onClose }) {
  const activities = [
    { id: 'forum', label: 'Forum', icon: '💬' },
    { id: 'assign', label: 'Ödev', icon: '📖' },
    { id: 'quiz', label: 'Sınav', icon: '📝' },
    // Diğerleri...
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-100 flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Aktivite Ekle</h2>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>

        {/* Aktivite Tipi Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {activities.map(act => (
            <button key={act.id} className="flex flex-col items-center p-3 border rounded-xl hover:bg-blue-50">
              <span className="text-2xl mb-2">{act.icon}</span>
              <span className="text-xs font-bold">{act.label}</span>
            </button>
          ))}
        </div>

        {/* Bilgi Paneli */}
        <div className="space-y-4">
          {activities.map(act => (
            <div key={act.id} className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg">
              <h4 className="font-bold mb-1">{act.label}</h4>
              <p className="text-xs text-gray-600">Öğrencilerle {act.label.toLowerCase()} oluşturabilirsiniz.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}