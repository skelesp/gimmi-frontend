import { berekenAfmetingen, laadAfbeelding, MAX_ZIJDE, verkleinAfbeelding } from './resize-image';

// Foto's verkleinen in de browser vóór het opladen (sc-3028).
describe('resize-image', () => {

  /** Maakt een echte PNG van de gevraagde grootte, met een doorzichtige helft. */
  function maakPng(breedte: number, hoogte: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = breedte;
    canvas.height = hoogte;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, 0, breedte / 2, hoogte);   // rechterhelft blijft doorzichtig
    return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
  }

  function afmetingenVan(dataUri: string): Promise<{ w: number, h: number }> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = dataUri;
    });
  }

  describe('berekenAfmetingen', () => {
    it('liggend groter dan het maximum: langste kant wordt het maximum, verhouding blijft', () => {
      expect(berekenAfmetingen(4000, 3000)).toEqual({ breedte: MAX_ZIJDE, hoogte: 1200 });
    });
    it('staand: de hoogte is de langste kant', () => {
      expect(berekenAfmetingen(3000, 4000, 1000)).toEqual({ breedte: 750, hoogte: 1000 });
    });
    it('kleiner dan het maximum: niet vergroten', () => {
      expect(berekenAfmetingen(640, 480)).toEqual({ breedte: 640, hoogte: 480 });
    });
  });

  it('verkleinAfbeelding: geeft een JPEG-data-URI op de verkleinde maat', async () => {
    const dataUri = await verkleinAfbeelding(await maakPng(400, 200), 100);
    expect(dataUri.startsWith('data:image/jpeg;base64,')).toBeTrue();
    expect(await afmetingenVan(dataUri)).toEqual({ w: 100, h: 50 });
  });

  it('verkleinAfbeelding: een doorzichtig deel wordt wit, niet zwart', async () => {
    const dataUri = await verkleinAfbeelding(await maakPng(20, 10), 20);
    const img = await laadAfbeelding(await (await fetch(dataUri)).blob());
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const [r, g, b] = Array.from(ctx.getImageData(17, 5, 1, 1).data);
    expect(Math.min(r, g, b)).toBeGreaterThan(240);
  });

  it('laadAfbeelding: een bestand dat geen afbeelding is, wordt geweigerd', async () => {
    await expectAsync(laadAfbeelding(new Blob(['geen afbeelding'], { type: 'image/png' }))).toBeRejectedWithError('Geen leesbare afbeelding');
  });
});
