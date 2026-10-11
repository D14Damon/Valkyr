/**
 * Resizes and compresses image files into Base64 data strings for Turso member profiles.
 */
export const MAX_TURSO_PHOTO_LENGTH = 1400 * 1024;

export async function fileToBase64Optimized(
  file: File,
  maxWidth = 900,
  maxHeight = 900,
  quality = 0.86
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to prepare the selected image.'));
          return;
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        if (compressedBase64.length > MAX_TURSO_PHOTO_LENGTH) {
          reject(new Error('The compressed photo is too large for Turso. Please choose a smaller image.'));
          return;
        }
        resolve(compressedBase64);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Returns estimated size of a Base64 string in kilobytes.
 */
export function getBase64SizeKb(base64String: string): number {
  if (!base64String) return 0;
  const stringLength = base64String.length - (base64String.indexOf(',') + 1);
  const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383687;
  return Math.round(sizeInBytes / 1024);
}
