import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, handleStorageError } from '../lib/firebase';
import toast from 'react-hot-toast';

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Maksimum boyutlar
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;

      let width = img.width;
      let height = img.height;

      // En boy oranını koru
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      if (height > MAX_HEIGHT) {
        width = Math.round((width * MAX_HEIGHT) / height);
        height = MAX_HEIGHT;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        0.8
      );
    };
    img.onerror = (error) => {
      console.error('Resim sıkıştırma hatası:', error);
      resolve(file); // Sıkıştırma başarısız olursa orijinal dosyayı kullan
    };
  });
};

export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    // Dosya boyutu kontrolü
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Dosya boyutu 5MB\'dan büyük olamaz');
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      throw new Error('Sadece resim dosyaları yüklenebilir');
    }

    // Resmi sıkıştır
    const compressedFile = await compressImage(file);
    
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fullPath = `${path}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, fullPath);

    const metadata = {
      contentType: compressedFile.type,
      customMetadata: {
        originalName: file.name,
        timestamp: timestamp.toString()
      }
    };

    try {
      const snapshot = await uploadBytes(storageRef, compressedFile, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (uploadError: any) {
      console.error('Dosya yükleme hatası:', uploadError);
      if (uploadError.code === 'storage/unauthorized') {
        throw new Error('Dosya yükleme yetkisi yok');
      } else if (uploadError.code === 'storage/canceled') {
        throw new Error('Dosya yükleme iptal edildi');
      } else if (uploadError.code === 'storage/retry-limit-exceeded') {
        throw new Error('Yükleme zaman aşımına uğradı, lütfen tekrar deneyin');
      } else {
        throw new Error('Dosya yüklenirken bir hata oluştu: ' + uploadError.message);
      }
    }
  } catch (error: any) {
    console.error('Fotoğraf yükleme hatası:', error);
    handleStorageError(error);
    throw error;
  }
};

export const uploadMultipleFiles = async (
  files: File[],
  path: string,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  let completed = 0;
  let errors: Error[] = [];

  try {
    for (const file of files) {
      try {
        const url = await uploadFile(file, path);
        urls.push(url);
        completed++;
        
        if (onProgress) {
          onProgress((completed / files.length) * 100);
        }
      } catch (error: any) {
        errors.push(error);
        console.error(`${file.name} yüklenirken hata:`, error);
      }
    }

    if (errors.length > 0) {
      if (errors.length === files.length) {
        // Tüm dosyalar başarısız olduysa
        throw new Error('Hiçbir dosya yüklenemedi');
      } else {
        // Bazı dosyalar başarısız olduysa
        toast.error(`${errors.length} dosya yüklenemedi`);
      }
    }

    return urls;
  } catch (error) {
    console.error('Toplu yükleme hatası:', error);
    throw error;
  }
};