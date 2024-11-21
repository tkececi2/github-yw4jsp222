import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Pencil, Trash2, X } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MusteriForm } from '../components/MusteriForm';
import { SilmeOnayModal } from '../components/SilmeOnayModal';
import toast from 'react-hot-toast';
import type { Kullanici } from '../types';

interface Saha {
  id: string;
  ad: string;
}

export const Musteriler: React.FC = () => {
  const { kullanici } = useAuth();
  const [musteriler, setMusteriler] = useState<Kullanici[]>([]);
  const [sahalar, setSahalar] = useState<Saha[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenecekMusteri, setDuzenlenecekMusteri] = useState<Kullanici | null>(null);
  const [silinecekMusteri, setSilinecekMusteri] = useState<string | null>(null);

  // Yönetici kontrolü
  const isYonetici = kullanici?.rol === 'yonetici';

  useEffect(() => {
    const veriGetir = async () => {
      if (!isYonetici) {
        toast.error('Bu sayfaya erişim yetkiniz yok');
        return;
      }

      try {
        // Sahaları getir
        const sahaQuery = query(collection(db, 'sahalar'), orderBy('ad'));
        const sahaSnapshot = await getDocs(sahaQuery);
        const sahaListesi = sahaSnapshot.docs.map(doc => ({
          id: doc.id,
          ad: doc.data().ad
        }));
        setSahalar(sahaListesi);

        // Müşterileri getir
        const musteriQuery = query(collection(db, 'kullanicilar'));
        const musteriSnapshot = await getDocs(musteriQuery);
        const musteriListesi = musteriSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.rol === 'musteri') as Kullanici[];
        
        setMusteriler(musteriListesi);
      } catch (error) {
        console.error('Veri getirme hatası:', error);
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, [isYonetici]);

  const handleMusteriSil = async (id: string) => {
    if (!isYonetici) {
      toast.error('Bu işlem için yetkiniz yok');
      return;
    }

    setYukleniyor(true);
    try {
      await deleteDoc(doc(db, 'kullanicilar', id));
      toast.success('Müşteri başarıyla silindi');
      setSilinecekMusteri(null);
    } catch (error) {
      console.error('Müşteri silme hatası:', error);
      toast.error('Müşteri silinirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  const handleMusteriDuzenle = (musteri: Kullanici) => {
    setDuzenlenecekMusteri(musteri);
    setFormAcik(true);
  };

  if (!isYonetici) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  if (yukleniyor) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteri Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Toplam {musteriler.length} müşteri
          </p>
        </div>
        <button
          onClick={() => {
            setDuzenlenecekMusteri(null);
            setFormAcik(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Yeni Müşteri Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {musteriler.map((musteri) => (
          <div
            key={musteri.id}
            className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300"
          >
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
                <div className="text-sm text-gray-500">
                  <strong>Email:</strong> {musteri.email}
                </div>
                {musteri.telefon && (
                  <div className="text-sm text-gray-500">
                    <strong>Telefon:</strong> {musteri.telefon}
                  </div>
                )}
                {musteri.sahalar && musteri.sahalar.length > 0 && (
                  <div className="text-sm text-gray-500">
                    <strong>Sahalar:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {musteri.sahalar.map(sahaId => {
                        const saha = sahalar.find(s => s.id === sahaId);
                        return saha ? (
                          <li key={sahaId}>{saha.ad}</li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                )}
                {musteri.adres && (
                  <div className="text-sm text-gray-500">
                    <strong>Adres:</strong> {musteri.adres}
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => handleMusteriDuzenle(musteri)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Düzenle
                </button>
                <button
                  onClick={() => setSilinecekMusteri(musteri.id)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {formAcik && (
        <MusteriForm
          sahalar={sahalar}
          musteri={duzenlenecekMusteri}
          onClose={() => {
            setFormAcik(false);
            setDuzenlenecekMusteri(null);
          }}
        />
      )}

      {silinecekMusteri && (
        <SilmeOnayModal
          onConfirm={() => handleMusteriSil(silinecekMusteri)}
          onCancel={() => setSilinecekMusteri(null)}
        />
      )}
    </div>
  );
};