import React from 'react';
import { Mail, Phone, Building, MapPin, Trash2 } from 'lucide-react';
import type { Kullanici } from '../types';

interface Props {
  musteri: Kullanici;
  sahaAdi: string;
  onSil: () => void;
}

export const MusteriKart: React.FC<Props> = ({ musteri, sahaAdi, onSil }) => {
  return (
    <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center">
          <img
            src={musteri.fotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(musteri.ad)}&background=random`}
            alt={musteri.ad}
            className="h-16 w-16 rounded-full ring-2 ring-white"
          />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{musteri.ad}</h3>
            {musteri.sirket && (
              <p className="text-sm text-gray-500">{musteri.sirket}</p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="h-5 w-5 mr-2 text-gray-400" />
            {musteri.email}
          </div>
          {musteri.telefon && (
            <div className="flex items-center text-sm text-gray-500">
              <Phone className="h-5 w-5 mr-2 text-gray-400" />
              {musteri.telefon}
            </div>
          )}
          {musteri.saha && (
            <div className="flex items-center text-sm text-gray-500">
              <Building className="h-5 w-5 mr-2 text-gray-400" />
              {sahaAdi}
            </div>
          )}
          {musteri.adres && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-5 w-5 mr-2 text-gray-400" />
              {musteri.adres}
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onSil}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};