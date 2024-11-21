import { createUserWithProfile } from '../lib/firebase';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const createAdminUser = async () => {
  const auth = getAuth();
  const adminEmail = 'tolga@gmail.com';
  const adminPassword = '123456';

  try {
    // Önce mevcut admin hesabını kontrol et
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const userDoc = await getDoc(doc(db, 'kullanicilar', userCredential.user.uid));

    // Eğer kullanıcı zaten varsa ve yönetici ise, işlemi atla
    if (userDoc.exists() && userDoc.data()?.rol === 'yonetici') {
      return true;
    }

    // Yoksa yeni admin hesabı oluştur
    const adminData = {
      email: adminEmail,
      ad: "Tolga Admin",
      rol: "yonetici",
      fotoURL: `https://ui-avatars.com/api/?name=Tolga+Admin&background=random`
    };

    await createUserWithProfile(adminData.email, adminPassword, adminData);
    console.log('Admin hesabı oluşturuldu/güncellendi');
    return true;
  } catch (error: any) {
    // Network hatalarını sessizce yönet
    if (error.code === 'auth/network-request-failed') {
      console.warn('Network bağlantısı kurulamadı, admin hesabı kontrolü atlanıyor');
      return false;
    }

    // Diğer hataları konsola yazdır ama uygulamayı çökertme
    console.error('Admin hesabı oluşturulurken hata:', error);
    return false;
  }
};