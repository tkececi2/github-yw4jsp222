import { Timestamp } from 'firebase/firestore';

export type KullaniciRolu = 'tekniker' | 'muhendis' | 'yonetici' | 'musteri' | 'bekci';

export interface Kullanici {
  id: string;
  email: string;
  rol: KullaniciRolu;
  ad: string;
  fotoURL?: string;
  telefon?: string;
  sirket?: string;
  adres?: string;
  sahalar?: string[];
}

export type ArizaDurumu = 'acik' | 'devam-ediyor' | 'beklemede' | 'cozuldu';
export type ArizaOnceligi = 'dusuk' | 'orta' | 'yuksek' | 'acil';

export interface Ariza {
  id: string;
  baslik: string;
  aciklama: string;
  konum: string;
  durum: ArizaDurumu;
  oncelik: ArizaOnceligi;
  olusturmaTarihi: Timestamp;
  guncellenmeTarihi: Timestamp;
  olusturanKisi: string;
  atananKisi?: string;
  fotograflar: string[];
  yorumlar: Yorum[];
  saha: string;
  cozum?: {
    aciklama: string;
    malzemeler: string[];
    tamamlanmaTarihi: Timestamp;
    tamamlayanKisi: string;
  };
}

export interface Kontrol {
  id: string;
  bekciId: string;
  bekciAdi: string;
  sahaId: string;
  sahaAdi: string;
  tarih: Timestamp;
  saat: string;
  durum: 'normal' | 'anormal';
  aciklama: string;
  fotograflar: string[];
  konum: {
    lat: number;
    lng: number;
  };
}