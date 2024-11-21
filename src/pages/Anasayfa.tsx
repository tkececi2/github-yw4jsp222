import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Plus,
  Building,
  MapPin,
  User,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArizaDetayModal } from '../components/ArizaDetayModal';
import type { Ariza } from '../types';
import toast from 'react-hot-toast';

export const Anasayfa: React.FC = () => {
  const { kullanici } = useAuth();
  const navigate = useNavigate();
  const [arizalar, setArizalar] = useState<Ariza[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sahalar, setSahalar] = useState<Record<string, string>>({});
  const [kullanicilar, setKullanicilar] = useState<Record<string, any>>({});
  const [seciliAriza, setSeciliAriza] = useState<Ariza | null>(null);
  const [istatistikler, setIstatistikler] = useState({
    acikArizalar: 0,
    devamEdenArizalar: 0,
    bekleyenArizalar: 0,
    cozulenArizalar: 0,
    toplamAriza: 0,
    cozumOrani: 0,
    ortalamaYanitSuresi: 0
  });

  useEffect(() => {
    const veriGetir = async () => {
      if (!kullanici) return;

      try {
        // Sahaları getir
        let sahaQuery;
        if (kullanici.rol === 'musteri' && kullanici.sahalar) {
          sahaQuery = query(
            collection(db, 'sahalar'),
            where('__name__', 'in', kullanici.sahalar)
          );
        } else {
          sahaQuery = query(collection(db, 'sahalar'));
        }
        
        const sahaSnapshot = await getDocs(sahaQuery);
        const sahaMap: Record<string, string> = {};
        sahaSnapshot.docs.forEach(doc => {
          sahaMap[doc.id] = doc.data().ad;
        });
        setSahalar(sahaMap);

        // Kullanıcıları getir
        const kullaniciSnapshot = await getDocs(collection(db, 'kullanicilar'));
        const kullaniciMap: Record<string, any> = {};
        kullaniciSnapshot.docs.forEach(doc => {
          kullaniciMap[doc.id] = doc.data();
        });
        setKullanicilar(kullaniciMap);

        // Arızaları getir
        let arizaQuery;
        if (kullanici.rol === 'musteri') {
          if (!kullanici.sahalar || kullanici.sahalar.length === 0) {
            setArizalar([]);
            return;
          }
          arizaQuery = query(
            collection(db, 'arizalar'),
            where('saha', 'in', kullanici.sahalar),
            orderBy('olusturmaTarihi', 'desc')
          );
        } else {
          arizaQuery = query(
            collection(db, 'arizalar'),
            orderBy('olusturmaTarihi', 'desc')
          );
        }

        const snapshot = await getDocs(arizaQuery);
        const arizaVerileri = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Ariza[];
        
        setArizalar(arizaVerileri);

        // İstatistikleri hesapla
        const acik = arizaVerileri.filter(a => a.durum === 'acik').length;
        const devamEden = arizaVerileri.filter(a => a.durum === 'devam-ediyor').length;
        const bekleyen = arizaVerileri.filter(a => a.durum === 'beklemede').length;
        const cozulen = arizaVerileri.filter(a => a.durum === 'cozuldu').length;
        const toplam = arizaVerileri.length;

        // Çözüm süreleri hesaplama
        let toplamSure = 0;
        let cozulenArizaSayisi = 0;
        arizaVerileri.forEach(ariza => {
          if (ariza.cozum) {
            const baslangic = ariza.olusturmaTarihi.toDate();
            const bitis = ariza.cozum.tamamlanmaTarihi.toDate();
            toplamSure += (bitis.getTime() - baslangic.getTime()) / (1000 * 60 * 60); // Saat cinsinden
            cozulenArizaSayisi++;
          }
        });

        setIstatistikler({
          acikArizalar: acik,
          devamEdenArizalar: devamEden,
          bekleyenArizalar: bekleyen,
          cozulenArizalar: cozulen,
          toplamAriza: toplam,
          cozumOrani: toplam > 0 ? (cozulen / toplam) * 100 : 0,
          ortalamaYanitSuresi: cozulenArizaSayisi > 0 ? toplamSure / cozulenArizaSayisi : 0
        });

      } catch (error) {
        console.error('Veri alınamadı:', error);
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, [kullanici]);

  if (yukleniyor) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hoş Geldiniz, {kullanici?.ad}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {kullanici?.rol === 'musteri' 
              ? 'Arıza takip sistemi - Saha durumları'
              : 'Arıza takip sistemi - Genel durum'}
          </p>
        </div>
        {kullanici?.rol !== 'musteri' && (
          <button
            onClick={() => navigate('/arizalar')}
            className="modern-button-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Arıza Kaydı
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Açık Arızalar"
          value={istatistikler.acikArizalar}
          icon={AlertTriangle}
          color="red"
          progress={istatistikler.toplamAriza > 0 ? (istatistikler.acikArizalar / istatistikler.toplamAriza) * 100 : 0}
        />
        <StatsCard
          title="Devam Eden"
          value={istatistikler.devamEdenArizalar}
          icon={Clock}
          color="orange"
          progress={istatistikler.toplamAriza > 0 ? (istatistikler.devamEdenArizalar / istatistikler.toplamAriza) * 100 : 0}
        />
        <StatsCard
          title="Çözülen"
          value={istatistikler.cozulenArizalar}
          icon={CheckCircle}
          color="green"
          trend={{
            value: Math.round(istatistikler.cozumOrani),
            isPositive: true,
            label: 'çözüm oranı'
          }}
          progress={istatistikler.cozumOrani}
        />
        <StatsCard
          title="Ortalama Çözüm Süresi"
          value={`${Math.round(istatistikler.ortalamaYanitSuresi)} saat`}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Son Arızalar */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 truncate">Son Arızalar</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {arizalar.slice(0, 5).map((ariza) => (
            <div
              key={ariza.id}
              onClick={() => setSeciliAriza(ariza)}
              className="p-4 sm:p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
            >
              <div className="flex items-start space-x-4 sm:space-x-6">
                <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 relative rounded-lg overflow-hidden bg-gray-100">
                  {ariza.fotograflar?.[0] ? (
                    <img
                      src={ariza.fotograflar[0]}
                      alt="Arıza fotoğrafı"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIi8+PC9zdmc+';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {ariza.fotograflar && ariza.fotograflar.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded-full">
                      +{ariza.fotograflar.length - 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {ariza.baslik}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ariza.durum === 'cozuldu' ? 'bg-green-100 text-green-800' :
                      ariza.durum === 'devam-ediyor' ? 'bg-yellow-100 text-yellow-800' :
                      ariza.durum === 'beklemede' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ariza.durum.charAt(0).toUpperCase() + ariza.durum.slice(1).replace('-', ' ')}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Building className="flex-shrink-0 h-4 w-4 mr-1.5 text-gray-400" />
                      <span>{sahalar[ariza.saha] || 'Bilinmeyen Saha'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="flex-shrink-0 h-4 w-4 mr-1.5 text-gray-400" />
                      <span>{ariza.konum}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="flex-shrink-0 h-4 w-4 mr-1.5 text-gray-400" />
                      <span>{kullanicilar[ariza.olusturanKisi]?.ad || 'Bilinmeyen Kullanıcı'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="flex-shrink-0 h-4 w-4 mr-1.5 text-gray-400" />
                      <span>{format(ariza.olusturmaTarihi.toDate(), 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => navigate('/arizalar')}
            className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Tüm Arızaları Görüntüle
          </button>
        </div>
      </div>

      {seciliAriza && (
        <ArizaDetayModal
          ariza={seciliAriza}
          sahaAdi={sahalar[seciliAriza.saha] || 'Bilinmeyen Saha'}
          onClose={() => setSeciliAriza(null)}
        />
      )}
    </div>
  );
};