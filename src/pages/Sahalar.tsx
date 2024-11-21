import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Plus, Pencil, Trash2, X, Building } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Saha } from '../types';

export const Sahalar: React.FC = () => {
  const { kullanici } = useAuth();
  const [sahalar, setSahalar] = useState<Saha[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlemeModu, setDuzenlemeModu] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Saha, 'id'>>({
    ad: '',
    konum: '',
    kapasite: '',
    aciklama: ''
  });

  const canManage = kullanici?.rol === 'yonetici';

  useEffect(() => {
    if (!kullanici) return;

    let q;
    if (kullanici.rol === 'musteri' && kullanici.sahalar) {
      // Müşteri sadece kendi sahalarını görebilir
      q = query(
        collection(db, 'sahalar'),
        where('__name__', 'in', kullanici.sahalar)
      );
    } else {
      // Yönetici ve teknisyenler tüm sahaları görebilir
      q = query(collection(db, 'sahalar'), orderBy('ad'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sahaListesi = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Saha[];
      
      setSahalar(sahaListesi);
      setYukleniyor(false);
    }, (error) => {
      console.error('Sahalar getirilemedi:', error);
      toast.error('Saha listesi yüklenirken bir hata oluştu');
      setYukleniyor(false);
    });

    return () => unsubscribe();
  }, [kullanici]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error('Bu işlem için yetkiniz yok');
      return;
    }

    setYukleniyor(true);

    try {
      if (duzenlemeModu) {
        await updateDoc(doc(db, 'sahalar', duzenlemeModu), form);
        toast.success('Saha başarıyla güncellendi');
      } else {
        await addDoc(collection(db, 'sahalar'), {
          ...form,
          olusturmaTarihi: new Date()
        });
        toast.success('Yeni saha başarıyla eklendi');
      }

      setFormAcik(false);
      setForm({ ad: '', konum: '', kapasite: '', aciklama: '' });
      setDuzenlemeModu(null);
    } catch (error) {
      console.error('Saha kaydetme hatası:', error);
      toast.error('Saha kaydedilirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  const handleSil = async (id: string) => {
    if (!canManage) {
      toast.error('Bu işlem için yetkiniz yok');
      return;
    }

    if (!window.confirm('Bu sahayı silmek istediğinizden emin misiniz?')) return;

    setYukleniyor(true);
    try {
      await deleteDoc(doc(db, 'sahalar', id));
      toast.success('Saha başarıyla silindi');
    } catch (error) {
      console.error('Saha silme hatası:', error);
      toast.error('Saha silinirken bir hata oluştu');
    } finally {
      setYukleniyor(false);
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
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {kullanici?.rol === 'musteri' ? 'Sahalarım' : 'Saha Yönetimi'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {kullanici?.rol === 'musteri' ? 'Size atanan sahalar' : `Toplam ${sahalar.length} saha`}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setFormAcik(true);
              setDuzenlemeModu(null);
              setForm({ ad: '', konum: '', kapasite: '', aciklama: '' });
            }}
            className="modern-button-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Saha Ekle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sahalar.map((saha) => (
          <div key={saha.id} className="modern-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{saha.ad}</h3>
              <MapPin className="h-6 w-6 text-yellow-500" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                {saha.konum}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Building className="h-5 w-5 mr-2 text-gray-400" />
                {saha.kapasite}
              </div>
              {saha.aciklama && (
                <p className="text-sm text-gray-600 mt-2">{saha.aciklama}</p>
              )}
            </div>

            {canManage && (
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setForm({
                      ad: saha.ad,
                      konum: saha.konum,
                      kapasite: saha.kapasite,
                      aciklama: saha.aciklama || ''
                    });
                    setDuzenlemeModu(saha.id);
                    setFormAcik(true);
                  }}
                  className="modern-button-secondary flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Düzenle
                </button>
                <button
                  onClick={() => handleSil(saha.id)}
                  className="modern-button-secondary flex-1 !bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {formAcik && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {duzenlemeModu ? 'Saha Düzenle' : 'Yeni Saha Ekle'}
              </h2>
              <button
                onClick={() => {
                  setFormAcik(false);
                  setDuzenlemeModu(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Saha Adı
                </label>
                <input
                  type="text"
                  required
                  value={form.ad}
                  onChange={e => setForm(prev => ({ ...prev, ad: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Konum
                </label>
                <input
                  type="text"
                  required
                  value={form.konum}
                  onChange={e => setForm(prev => ({ ...prev, konum: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kapasite
                </label>
                <input
                  type="text"
                  required
                  value={form.kapasite}
                  onChange={e => setForm(prev => ({ ...prev, kapasite: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Açıklama
                </label>
                <textarea
                  value={form.aciklama}
                  onChange={e => setForm(prev => ({ ...prev, aciklama: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setFormAcik(false);
                    setDuzenlemeModu(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={yukleniyor}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                >
                  {yukleniyor ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">
                        {duzenlemeModu ? 'Güncelleniyor...' : 'Ekleniyor...'}
                      </span>
                    </>
                  ) : (
                    duzenlemeModu ? 'Güncelle' : 'Ekle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};