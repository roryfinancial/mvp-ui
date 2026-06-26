// Reads an image File and returns a compressed JPEG data URL (base64).
// Downscales to `maxDim` on the longest edge so we never persist a giant
// blob — gift/event thumbnails only need to look good at card size, and the
// data URL is stored inline in Postgres. Falls back to the raw data URL if
// canvas decoding fails (e.g. exotic format) so the upload still works.
export function fileToCompressedDataUrl(
  file: File,
  maxDim = 1000,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const raw = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(raw);
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(raw);
        }
      };
      img.onerror = () => resolve(raw);
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}
