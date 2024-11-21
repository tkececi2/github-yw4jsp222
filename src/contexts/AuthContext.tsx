import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, signInUser } from '../lib/firebase';
import type { Kullanici } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  kullanici: Kullanici | null;
  loading: boolean;
  setKullanici: (kullanici: Kullanici | null) => void;
  cikisYap: () => Promise<void>;
  girisYap: (email: string, sifre: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  kullanici: null,
  loading: true,
  setKullanici: () => {},
  cikisYap: async () => {},
  girisYap: async () => false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isLoggingOut = useRef(false);

  useEffect(() => {
    // Eğer çıkış yapılıyorsa veya zaten initialize edildiyse, yeni listener ekleme
    if (isLoggingOut.current || initialized) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Çıkış yapılmış durumda ise kullanıcı bilgilerini yükleme
          if (sessionStorage.getItem('isLoggedOut') === 'true') {
            setKullanici(null);
            setLoading(false);
            return;
          }

          // Firestore'dan kullanıcı bilgilerini al
          const userDoc = await getDoc(doc(db, 'kullanicilar', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Kullanici;
            setKullanici(userData);
          } else {
            // Kullanıcı dokümanı yoksa çıkış yap
            await signOut(auth);
            setKullanici(null);
          }
        } else {
          setKullanici(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setKullanici(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    });

    unsubscribeRef.current = unsubscribe;
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [initialized]);

  const girisYap = async (email: string, sifre: string): Promise<boolean> => {
    if (isLoggingOut.current) return false;

    try {
      // Çıkış yapılmış durumu temizle
      sessionStorage.removeItem('isLoggedOut');
      localStorage.removeItem('isLoggedOut');

      const userCredential = await signInUser(email, sifre);
      const userDoc = await getDoc(doc(db, 'kullanicilar', userCredential.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as Kullanici;
        setKullanici(userData);
        toast.success('Giriş başarılı');
        return true;
      } else {
        toast.error('Kullanıcı profili bulunamadı');
        await signOut(auth);
        setKullanici(null);
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const cikisYap = async () => {
    try {
      // Çıkış yapılıyor flag'ini set et
      isLoggingOut.current = true;

      // Önce auth listener'ı temizle
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // State'i temizle
      setKullanici(null);
      setInitialized(false);

      // Çıkış yapıldığını işaretle
      sessionStorage.setItem('isLoggedOut', 'true');
      localStorage.setItem('isLoggedOut', 'true');

      // Firebase'den çıkış yap
      await signOut(auth);

      // Local storage ve session storage'ı temizle (isLoggedOut hariç)
      const isLoggedOut = localStorage.getItem('isLoggedOut');
      const sessionIsLoggedOut = sessionStorage.getItem('isLoggedOut');
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('isLoggedOut', isLoggedOut!);
      sessionStorage.setItem('isLoggedOut', sessionIsLoggedOut!);

      // Firebase auth state'ini sıfırla
      await auth.signOut();

      // IndexedDB'yi temizle
      const databases = await window.indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });

      // Service worker'ları temizle
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Başarılı mesajı göster
      toast.success('Başarıyla çıkış yapıldı');

      // Sayfayı yeniden yükle
      window.location.href = '/login';
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      toast.error('Çıkış yapılırken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ kullanici, loading, setKullanici, cikisYap, girisYap }}>
      {children}
    </AuthContext.Provider>
  );
};