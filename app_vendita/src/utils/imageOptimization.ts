// Utility per ottimizzazione immagini
export const ImageOptimization = {
  // Configurazione per immagini ottimizzate
  getOptimizedImageConfig: (width: number, height: number) => ({
    width,
    height,
    quality: 0.8, // Qualità bilanciata
    format: 'webp', // Formato moderno e compresso
    cache: true,
  }),

  // Preload immagini critiche
  preloadCriticalImages: (imageUrls: string[]) => {
    if (typeof window !== 'undefined') {
      imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    }
  },

  // Lazy loading per immagini
  createLazyImageLoader: () => {
    let observer: IntersectionObserver | null = null;
    
    if (typeof window !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              img.src = img.dataset.src || '';
              observer?.unobserve(img);
            }
          });
        },
        {
          rootMargin: '50px',
        }
      );
    }

    return {
      observe: (element: Element) => observer?.observe(element),
      unobserve: (element: Element) => observer?.unobserve(element),
      disconnect: () => observer?.disconnect(),
    };
  },

  // Compressione immagini
  compressImage: async (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  },
};

// Hook per ottimizzazione immagini
export const useImageOptimization = () => {
  const preloadImages = (urls: string[]) => {
    ImageOptimization.preloadCriticalImages(urls);
  };

  const createLazyLoader = () => {
    return ImageOptimization.createLazyImageLoader();
  };

  const compressImage = async (file: File) => {
    return await ImageOptimization.compressImage(file);
  };

  return {
    preloadImages,
    createLazyLoader,
    compressImage,
  };
}; 