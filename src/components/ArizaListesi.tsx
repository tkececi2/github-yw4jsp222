import React from 'react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AlertTriangle, Clock, CheckCircle, Image as ImageIcon, MapPin, Building, User, Calendar, Edit, Trash2 } from 'lucide-react';
import type { Ariza } from '../types';

interface Props {
  arizalar: Ariza[];
  yukleniyor: boolean;
  isMusteri?: boolean;
  onArizaClick: (ariza: Ariza) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (ariza: Ariza) => void;
  onDelete?: (id: string) => void;
}

const durumRenkleri = {
  'acik': 'bg-red-100 text-red-800 border border-red-200',
  'devam-ediyor': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'beklemede': 'bg-blue-100 text-blue-800 border border-blue-200',
  'cozuldu': 'bg-green-100 text-green-800 border border-green-200'
};

const durumIkonlari = {
  'acik': AlertTriangle,
  'devam-ediyor': Clock,
  'beklemede': Clock,
  'cozuldu': CheckCircle
};

export const ArizaListesi: React.FC<Props> = ({
  arizalar,
  yukleniyor,
  isMusteri,
  onArizaClick,
  canEdit,
  canDelete,
  onEdit,
  onDelete
}) => {
  const getCozumSuresi = (ariza: Ariza) => {
    const simdi = new Date();
    const baslangic = ariza.olusturmaTarihi.toDate();
    const bitis = ariza.cozum ? ariza.cozum.tamamlanmaTarihi.toDate() : simdi;

    const gunFarki = differenceInDays(bitis, baslangic);
    const toplamSaatFarki = differenceInHours(bitis, baslangic);
    const saatFarki = toplamSaatFarki % 24;

    if (gunFarki === 0) {
      if (saatFarki === 0) {
        return '1 saatten az';
      }
      return `${saatFarki} saat`;
    }

    const sureMesaji = `${gunFarki} gün${saatFarki > 0 ? ` ${saatFarki} saat` : ''}`;
    return ariza.cozum ? `${sureMesaji}de çözüldü` : sureMesaji;
  };

  if (yukleniyor) {
    return (
      <div className="flex justify-center items-center py-8">
        <Clock className="h-8 w-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (arizalar.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Henüz arıza kaydı bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fotoğraf
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Arıza No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Başlık
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Saha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Konum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Öncelik
            </th>
            {!isMusteri && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oluşturan
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Süre
            </th>
            {(canEdit || canDelete) && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {arizalar.map((ariza) => {
            const DurumIkonu = durumIkonlari[ariza.durum];
            const fotograf = ariza.fotograflar?.[0];
            
            return (
              <tr
                key={ariza.id}
                onClick={() => onArizaClick(ariza)}
                className="hover:bg-gray-50 cursor-pointer transition-all duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                    {fotograf ? (
                      <img
                        src={fotograf}
                        alt="Arıza fotoğrafı"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIi8+PC9zdmc+';
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{ariza.id.slice(-6).toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ariza.baslik}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-1 text-gray-400" />
                    {ariza.sahaAdi}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                    {ariza.konum}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${durumRenkleri[ariza.durum]}`}>
                    <DurumIkonu className="h-4 w-4 mr-1" />
                    {ariza.durum.charAt(0).toUpperCase() + ariza.durum.slice(1).replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ariza.oncelik.charAt(0).toUpperCase() + ariza.oncelik.slice(1)}
                </td>
                {!isMusteri && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      {ariza.olusturanKisiAdi}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={ariza.cozum ? 'text-green-600' : 'text-gray-500'}>
                    {getCozumSuresi(ariza)}
                  </span>
                </td>
                {(canEdit || canDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(ariza);
                          }}
                          className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-50 rounded-full transition-colors duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(ariza.id);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};