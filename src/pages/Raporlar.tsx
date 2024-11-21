import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArizaKart } from '../components/ArizaKart';
import { ArizaListesi } from '../components/ArizaListesi';
import { ArizaDetayModal } from '../components/ArizaDetayModal';
import { 
  Download,
  LayoutGrid,
  List,
  BarChart2,
  Calendar
} from 'lucide-react';
import { Card, Title, DonutChart, ProgressBar, Flex, Text } from '@tremor/react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import type { Ariza } from '../types';
import toast from 'react-hot-toast';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export const Raporlar = () => {
  const { kullanici } = useAuth();
  const [arizalar, setArizalar] = useState<Ariza[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenSaha, setSecilenSaha] = useState<string>('');
  const [sahalar, setSahalar] = useState<Record<string, string>>({});
  const [seciliAriza, setSeciliAriza] = useState<Ariza | null>(null);
  const [gorunumTipi, setGorunumTipi] = useState<'kart' | 'liste' | 'performans'>('kart');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const getDateFilterQuery = () => {
    const now = new Date();
    let startDate: Date;

    switch (dateFilter) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'custom':
        return {
          start: startOfDay(new Date(customDateRange.start)),
          end: endOfDay(new Date(customDateRange.end))
        };
      default:
        return null;
    }

    return dateFilter === 'all' ? null : {
      start: startDate,
      end: endOfDay(now)
    };
  };

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

        // Arızaları getir
        let baseQuery = collection(db, 'arizalar');
        let constraints: any[] = [orderBy('olusturmaTarihi', 'desc')];

        // Saha filtresi
        if (kullanici.rol === 'musteri' && kullanici.sahalar) {
          if (secilenSaha) {
            if (!kullanici.sahalar.includes(secilenSaha)) {
              setArizalar([]);
              return;
            }
            constraints.push(where('saha', '==', secilenSaha));
          } else {
            constraints.push(where('saha', 'in', kullanici.sahalar));
          }
        } else if (secilenSaha) {
          constraints.push(where('saha', '==', secilenSaha));
        }

        // Tarih filtresi
        const dateRange = getDateFilterQuery();
        if (dateRange) {
          constraints.push(
            where('olusturmaTarihi', '>=', Timestamp.fromDate(dateRange.start)),
            where('olusturmaTarihi', '<=', Timestamp.fromDate(dateRange.end))
          );
        }

        const arizaQuery = query(baseQuery, ...constraints);
        const snapshot = await getDocs(arizaQuery);
        const arizaVerileri = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Ariza[];
        
        setArizalar(arizaVerileri);
      } catch (error) {
        console.error('Veri getirme hatası:', error);
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, [kullanici, secilenSaha, dateFilter, customDateRange]);

  const handleRaporIndir = () => {
    try {
      const headers = ['Arıza No', 'Başlık', 'Saha', 'Durum', 'Öncelik', 'Oluşturma Tarihi', 'Çözüm Tarihi'];
      const rows = arizalar.map(ariza => [
        ariza.id.slice(-6).toUpperCase(),
        ariza.baslik,
        sahalar[ariza.saha] || 'Bilinmeyen Saha',
        ariza.durum.charAt(0).toUpperCase() + ariza.durum.slice(1).replace('-', ' '),
        ariza.oncelik.charAt(0).toUpperCase() + ariza.oncelik.slice(1),
        new Date(ariza.olusturmaTarihi.toDate()).toLocaleString('tr-TR'),
        ariza.cozum ? new Date(ariza.cozum.tamamlanmaTarihi.toDate()).toLocaleString('tr-TR') : '-'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ariza-raporu-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success('Rapor başarıyla indirildi');
    } catch (error) {
      console.error('Rapor indirme hatası:', error);
      toast.error('Rapor indirilirken bir hata oluştu');
    }
  };

  if (yukleniyor) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arıza Raporları</h1>
          <p className="mt-1 text-sm text-gray-500">
            {kullanici?.rol === 'musteri' 
              ? 'Sahalarınıza ait arıza raporları'
              : 'Genel arıza raporları'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Saha Filtresi */}
          <select
            value={secilenSaha}
            onChange={(e) => setSecilenSaha(e.target.value)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="">Tüm Sahalar</option>
            {Object.entries(sahalar).map(([id, ad]) => (
              <option key={id} value={id}>{ad}</option>
            ))}
          </select>

          {/* Tarih Filtresi */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="all">Tüm Tarihler</option>
            <option value="today">Bugün</option>
            <option value="week">Son 7 Gün</option>
            <option value="month">Son 30 Gün</option>
            <option value="custom">Özel Tarih Aralığı</option>
          </select>

          {/* Özel Tarih Aralığı */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              />
            </div>
          )}

          {/* Görünüm Seçenekleri */}
          <div className="flex rounded-lg shadow-sm">
            <button
              onClick={() => setGorunumTipi('kart')}
              className={`p-2 text-sm font-medium rounded-l-lg border ${
                gorunumTipi === 'kart'
                  ? 'bg-primary-50 text-primary-700 border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setGorunumTipi('liste')}
              className={`p-2 text-sm font-medium border-t border-b ${
                gorunumTipi === 'liste'
                  ? 'bg-primary-50 text-primary-700 border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setGorunumTipi('performans')}
              className={`p-2 text-sm font-medium rounded-r-lg border ${
                gorunumTipi === 'performans'
                  ? 'bg-primary-50 text-primary-700 border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <BarChart2 className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={handleRaporIndir}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV İndir
          </button>
        </div>
      </div>

      {gorunumTipi === 'performans' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Title>Arıza Durumu Dağılımı</Title>
            <DonutChart
              className="mt-6"
              data={[
                { name: 'Açık', value: arizalar.filter(a => a.durum === 'acik').length },
                { name: 'Devam Eden', value: arizalar.filter(a => a.durum === 'devam-ediyor').length },
                { name: 'Bekleyen', value: arizalar.filter(a => a.durum === 'beklemede').length },
                { name: 'Çözülen', value: arizalar.filter(a => a.durum === 'cozuldu').length }
              ]}
              category="value"
              index="name"
              colors={["red", "yellow", "blue", "green"]}
              valueFormatter={(value) => `${value} Arıza`}
            />
          </Card>

          <Card>
            <Title>Saha Bazlı Performans</Title>
            <div className="mt-6 space-y-4">
              {Object.entries(sahalar).map(([sahaId, sahaAdi]) => {
                const sahaArizalari = arizalar.filter(a => a.saha === sahaId);
                const cozulenler = sahaArizalari.filter(a => a.durum === 'cozuldu').length;
                const toplam = sahaArizalari.length;
                const oran = toplam > 0 ? (cozulenler / toplam) * 100 : 0;

                return (
                  <div key={sahaId}>
                    <Flex>
                      <Text>{sahaAdi}</Text>
                      <Text>%{oran.toFixed(1)}</Text>
                    </Flex>
                    <ProgressBar value={oran} className="mt-2" />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : gorunumTipi === 'liste' ? (
        <ArizaListesi
          arizalar={arizalar}
          yukleniyor={yukleniyor}
          onArizaClick={(ariza) => setSeciliAriza(ariza)}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {arizalar.map((ariza) => (
            <div key={ariza.id} className="transform scale-90 origin-top-left">
              <ArizaKart
                ariza={ariza}
                sahaAdi={sahalar[ariza.saha] || 'Bilinmeyen Saha'}
                kullaniciAdi={ariza.olusturanKisi}
                onClick={() => setSeciliAriza(ariza)}
                compact={true}
              />
            </div>
          ))}
        </div>
      )}

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