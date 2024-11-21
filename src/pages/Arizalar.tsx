import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter, LayoutGrid, List, Edit, Trash2 } from 'lucide-react';
import { ArizaForm } from '../components/ArizaForm';
import { ArizaKart } from '../components/ArizaKart';
import { ArizaListesi } from '../components/ArizaListesi';
import { ArizaDetayModal } from '../components/ArizaDetayModal';
import { SilmeOnayModal } from '../components/SilmeOnayModal';
import type { Ariza } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SearchInput } from '../components/SearchInput';
import toast from 'react-hot-toast';

export const Arizalar: React.FC = () => {
  const { kullanici } = useAuth();
  const [arizalar, setArizalar] = useState<Ariza[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [formAcik, setFormAcik] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');
  const [secilenSaha, setSecilenSaha] = useState<string>('');
  const [secilenDurum, setSecilenDurum] = useState<string>('');
  const [gorunumTipi, setGorunumTipi] = useState<'kart' | 'liste'>('kart');
  const [sahalar, setSahalar] = useState<Record<string, string>>({});
  const [kullanicilar, setKullanicilar] = useState<Record<string, any>>({});
  const [seciliAriza, setSeciliAriza] = useState<Ariza | null>(null);
  const [duzenlenecekAriza, setDuzenlenecekAriza] = useState<Ariza | null>(null);
  const [silinecekAriza, setSilinecekAriza] = useState<string | null>(null);

  // Yetki kontrolü
  const canEdit = kullanici?.rol && ['yonetici', 'tekniker', 'muhendis'].includes(kullanici.rol);
  const canDelete = kullanici?.rol && ['yonetici', 'tekniker', 'muhendis'].includes(kullanici.rol);

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
        } else if (secilenSaha) {
          arizaQuery = query(
            collection(db, 'arizalar'),
            where('saha', '==', secilenSaha),
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
      } catch (error) {
        console.error('Veri getirme hatası:', error);
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, [kullanici, secilenSaha]);

  const handleArizaSil = async (id: string) => {
    if (!canDelete) {
      toast.error('Bu işlem için yetkiniz yok');
      return;
    }

    setYukleniyor(true);
    try {
      await deleteDoc(doc(db, 'arizalar', id));
      toast.success('Arıza başarıyla silindi');
      setSilinecekAriza(null);
      // Listeyi güncelle
      setArizalar(prev => prev.filter(ariza => ariza.id !== id));
    } catch (error) {
      console.error('Arıza silme hatası:', error);
      toast.error('Arıza silinirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  const handleArizaDuzenle = (ariza: Ariza) => {
    if (!canEdit) {
      toast.error('Bu işlem için yetkiniz yok');
      return;
    }
    setDuzenlenecekAriza(ariza);
    setFormAcik(true);
  };

  const filtrelenmisArizalar = arizalar.filter(ariza => {
    const aramaUyumu = aramaMetni
      ? ariza.baslik.toLowerCase().includes(aramaMetni.toLowerCase()) ||
        ariza.aciklama.toLowerCase().includes(aramaMetni.toLowerCase())
      : true;

    const durumUyumu = secilenDurum ? ariza.durum === secilenDurum : true;

    return aramaUyumu && durumUyumu;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arızalar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Toplam {filtrelenmisArizalar.length} arıza kaydı
          </p>
        </div>
        {!kullanici?.rol?.includes('musteri') && (
          <button
            onClick={() => {
              setDuzenlenecekAriza(null);
              setFormAcik(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Arıza Kaydı
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={aramaMetni}
            onChange={setAramaMetni}
            placeholder="Arıza ara..."
          />
        </div>
        <div className="flex gap-4">
          <select
            value={secilenSaha}
            onChange={(e) => setSecilenSaha(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          >
            <option value="">Tüm Sahalar</option>
            {Object.entries(sahalar).map(([id, ad]) => (
              <option key={id} value={id}>{ad}</option>
            ))}
          </select>
          <select
            value={secilenDurum}
            onChange={(e) => setSecilenDurum(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="acik">Açık</option>
            <option value="devam-ediyor">Devam Ediyor</option>
            <option value="beklemede">Beklemede</option>
            <option value="cozuldu">Çözüldü</option>
          </select>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setGorunumTipi('kart')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                gorunumTipi === 'kart'
                  ? 'bg-yellow-50 text-yellow-600 border-yellow-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setGorunumTipi('liste')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b -ml-px ${
                gorunumTipi === 'liste'
                  ? 'bg-yellow-50 text-yellow-600 border-yellow-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {yukleniyor ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : gorunumTipi === 'kart' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrelenmisArizalar.map((ariza) => (
            <div key={ariza.id} className="relative">
              <ArizaKart
                ariza={ariza}
                sahaAdi={sahalar[ariza.saha] || 'Bilinmeyen Saha'}
                kullaniciAdi={kullanicilar[ariza.olusturanKisi]?.ad || 'Bilinmeyen Kullanıcı'}
                onClick={() => setSeciliAriza(ariza)}
              />
              {(canEdit || canDelete) && (
                <div className="absolute top-2 right-2 flex space-x-2">
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArizaDuzenle(ariza);
                      }}
                      className="p-1 bg-white rounded-full shadow-lg hover:bg-yellow-50"
                    >
                      <Edit className="h-4 w-4 text-yellow-600" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSilinecekAriza(ariza.id);
                      }}
                      className="p-1 bg-white rounded-full shadow-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <ArizaListesi
          arizalar={filtrelenmisArizalar}
          yukleniyor={yukleniyor}
          isMusteri={kullanici?.rol === 'musteri'}
          onArizaClick={(ariza) => setSeciliAriza(ariza)}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleArizaDuzenle}
          onDelete={(id) => setSilinecekAriza(id)}
        />
      )}

      {formAcik && (
        <ArizaForm
          ariza={duzenlenecekAriza}
          onClose={() => {
            setFormAcik(false);
            setDuzenlenecekAriza(null);
          }}
        />
      )}

      {seciliAriza && (
        <ArizaDetayModal
          ariza={seciliAriza}
          sahaAdi={sahalar[seciliAriza.saha] || 'Bilinmeyen Saha'}
          onClose={() => setSeciliAriza(null)}
        />
      )}

      {silinecekAriza && (
        <SilmeOnayModal
          onConfirm={() => handleArizaSil(silinecekAriza)}
          onCancel={() => setSilinecekAriza(null)}
          mesaj="Bu arızayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        />
      )}
    </div>
  );
};