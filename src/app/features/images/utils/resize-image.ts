/**
 * Resizes a chosen photo in the browser and returns it as a JPEG Blob (sc-3028, sc-3290).
 *
 * A phone photo is easily 4-10 MB; resized to 1600 px on the longest side
 * it stays at a few hundred kB. That fits well within the backend limit
 * (8 MB body) and uploads faster over a mobile network.
 *
 * Browsers already rotate a photo to its EXIF orientation when drawing it
 * (image-orientation: from-image is the default), so that is not needed here.
 */
export const MAX_SIDE = 1600;
export const JPEG_QUALITY = 0.85;

export function calculateDimensions(width: number, height: number, max: number = MAX_SIDE): { width: number, height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Not a readable image')); };
    img.src = url;
  });
}

export async function resizeImage(file: Blob, max: number = MAX_SIDE): Promise<Blob> {
  const img = await loadImage(file);
  const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight, max);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  // JPEG has no transparency: a transparent PNG gets a white background, not a black one.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Not a readable image')), 'image/jpeg', JPEG_QUALITY));
}
