import React, { useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useBildirimler } from '../contexts/BildirimContext';
import { BildirimListesi } from './BildirimListesi';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

export const BildirimMenusu: React.FC = () => {
  const [acik, setAcik] = useState(false);
  const { bildirimler, okunmamisSayisi, tumunuOku } = useBildirimler();
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setAcik(false));

  const handleAc = () => {
    setAcik(!acik);
    if (!acik) {
      tumunuOku();
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={handleAc}
        className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        aria-label={`Bildirimleri ${acik ? 'kapat' : 'aç'}`}
      >
        <Bell className="h-6 w-6" />
        {okunmamisSayisi > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-xs font-medium text-white">
            {okunmamisSayisi}
          </span>
        )}
      </button>

      {acik && (
        <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 max-h-[calc(100vh-5rem)] sm:max-h-[80vh] flex flex-col transform origin-top transition-all duration-200 ease-out">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Bildirimler</h3>
              <button
                onClick={() => tumunuOku()}
                className="text-sm text-yellow-600 hover:text-yellow-700"
              >
                Tümünü Okundu İşaretle
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <BildirimListesi onClose={() => setAcik(false)} />
          </div>
        </div>
      )}
    </div>
  );
};