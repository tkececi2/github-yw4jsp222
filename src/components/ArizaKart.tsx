import React from 'react';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { AlertTriangle, Clock, CheckCircle, Image as ImageIcon, MapPin, Building, User, Calendar } from 'lucide-react';
import type { Ariza } from '../types';

interface Props {
  ariza: Ariza;
  sahaAdi: string;
  kullaniciAdi?: string;
  onClick: () => void;
  compact?: boolean;
}

export const ArizaKart: React.FC<Props> = ({ ariza, sahaAdi, kullaniciAdi, onClick, compact = false }) => {
  const getCozumSuresi = () => {
    const baslangic = ariza.olusturmaTarihi.toDate();
    const bitis = ariza.cozum ? ariza.cozum.tamamlanmaTarihi.toDate() : new Date();
    
    const saatFarki = differenceInHours(bitis, baslangic);
    const gunFarki = differenceInDays(bitis, baslangic);
    const kalanSaat = saatFarki % 24;

    if (ariza.cozum) {
      if (gunFarki === 0) {
        return kalanSaat === 0 ? '1 saatte çözüldü' : `${kalanSaat} saatte çözüldü`;
      } else {
        return `${gunFarki} gün ${kalanSaat} saatte çözüldü`;
      }
    } else {
      if (gunFarki === 0) {
        return kalanSaat === 0 ? '1 saat' : `${kalanSaat} saat`;
      } else {
        return `${gunFarki} gün ${kalanSaat} saat`;
      }
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder-image.png';
  };

  const ilkFotograf = ariza.fotograflar?.[0];

  return (
    <div 
      className={`modern-card ${compact ? 'scale-95' : ''}`}
      onClick={onClick}
    >
      <div className={`relative ${compact ? 'aspect-[3/2] sm:aspect-[4/3]' : 'aspect-[3/2] sm:aspect-video'}`}>
        {ilkFotograf ? (
          <img
            src={ilkFotograf}
            alt="Arıza fotoğrafı"
            className="w-full h-full object-cover rounded-t-lg"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        {ariza.fotograflar && ariza.fotograflar.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded-full">
            +{ariza.fotograflar.length - 1}
          </div>
        )}
      </div>
      
      <div className={`p-4 sm:p-5 space-y-4`}>
        <div>
          <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'} line-clamp-2`}>
            {ariza.baslik}
          </h3>
          
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              ariza.durum === 'cozuldu' ? 'bg-green-100 text-green-800 border border-green-200' :
              ariza.durum === 'devam-ediyor' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              ariza.durum === 'beklemede' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
              'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {ariza.durum === 'cozuldu' && <CheckCircle className="w-3.5 h-3.5 mr-1" />}
              {ariza.durum === 'devam-ediyor' && <Clock className="w-3.5 h-3.5 mr-1" />}
              {ariza.durum === 'beklemede' && <Clock className="w-3.5 h-3.5 mr-1" />}
              {ariza.durum === 'acik' && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
              {ariza.durum.charAt(0).toUpperCase() + ariza.durum.slice(1).replace('-', ' ')}
            </span>
          </div>
        </div>
        
        <div className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
          <div className="flex items-center">
            <Building className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} mr-1.5 text-gray-400`} />
            <span className="truncate">{sahaAdi}</span>
          </div>
          <div className="flex items-center">
            <MapPin className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} mr-1.5 text-gray-400`} />
            <span className="truncate">{ariza.konum}</span>
          </div>
          <div className="flex items-center">
            <User className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} mr-1.5 text-gray-400`} />
            <span className="truncate">{kullaniciAdi || 'Bilinmeyen Kullanıcı'}</span>
          </div>
        </div>

        <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'} pt-3 border-t border-gray-100`}>
          <div className="flex items-center text-gray-500">
            <Calendar className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} mr-1.5 text-gray-400`} />
            {format(ariza.olusturmaTarihi.toDate(), 'dd MMM yyyy', { locale: tr })}
          </div>
          <div className={`flex items-center ${ariza.cozum ? 'text-green-600' : 'text-gray-500'}`}>
            <Clock className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} mr-1.5`} />
            {getCozumSuresi()}
          </div>
        </div>
      </div>
    </div>
  );
};