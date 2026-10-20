/**
 * Verkleint een gekozen foto in de browser en geeft hem terug als JPEG-data-URI (sc-3028).
 *
 * Een foto van een gsm is al snel 4-10 MB; verkleind tot 1600 px aan de langste kant
 * blijft daar enkele honderden kB van over. Dat past ruim binnen de limiet van de
 * backend (8 MB body) en laadt sneller op over mobiel netwerk.
 *
 * Browsers draaien een foto bij het tekenen al volgens zijn EXIF-oriëntatie
 * (image-orientation: from-image is de standaard), dus dat hoeft hier niet.
 */
export const MAX_ZIJDE = 1600;
export const JPEG_KWALITEIT = 0.85;

export function berekenAfmetingen(breedte: number, hoogte: number, max: number = MAX_ZIJDE): { breedte: number, hoogte: number } {
  const schaal = Math.min(1, max / Math.max(breedte, hoogte));
  return { breedte: Math.round(breedte * schaal), hoogte: Math.round(hoogte * schaal) };
}

export function laadAfbeelding(bestand: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(bestand);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Geen leesbare afbeelding')); };
    img.src = url;
  });
}

export async function verkleinAfbeelding(bestand: Blob, max: number = MAX_ZIJDE): Promise<string> {
  const img = await laadAfbeelding(bestand);
  const { breedte, hoogte } = berekenAfmetingen(img.naturalWidth, img.naturalHeight, max);

  const canvas = document.createElement('canvas');
  canvas.width = breedte;
  canvas.height = hoogte;
  const ctx = canvas.getContext('2d');
  // JPEG kent geen transparantie: een doorzichtige PNG krijgt een witte achtergrond, geen zwarte.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, breedte, hoogte);
  ctx.drawImage(img, 0, 0, breedte, hoogte);
  return canvas.toDataURL('image/jpeg', JPEG_KWALITEIT);
}
