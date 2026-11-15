import { calculateDimensions, loadImage, MAX_SIDE, resizeImage } from './resize-image';

// Resizing photos in the browser before uploading (sc-3028).
describe('resize-image', () => {

    /** Makes a real PNG of the requested size, with a transparent half. */
    function makePng(width: number, height: number): Promise<Blob> {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f00';
        ctx.fillRect(0, 0, width / 2, height); // right half stays transparent
        return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
    }

    function dimensionsOf(blob: Blob): Promise<{
        w: number;
        h: number;
    }> {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
            img.src = URL.createObjectURL(blob);
        });
    }

    describe('calculateDimensions', () => {
        it('landscape larger than the maximum: longest side becomes the maximum, ratio stays', () => {
            expect(calculateDimensions(4000, 3000)).toEqual({ width: MAX_SIDE, height: 1200 });
        });
        it('portrait: the height is the longest side', () => {
            expect(calculateDimensions(3000, 4000, 1000)).toEqual({ width: 750, height: 1000 });
        });
        it('smaller than the maximum: do not enlarge', () => {
            expect(calculateDimensions(640, 480)).toEqual({ width: 640, height: 480 });
        });
    });

    it('resizeImage: returns a JPEG Blob at the reduced size', async () => {
        const jpeg = await resizeImage(await makePng(400, 200), 100);
        expect(jpeg.type).toBe('image/jpeg');
        expect(await dimensionsOf(jpeg)).toEqual({ w: 100, h: 50 });
    });

    it('resizeImage: a transparent part becomes white, not black', async () => {
        const jpeg = await resizeImage(await makePng(20, 10), 20);
        const img = await loadImage(jpeg);
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const [r, g, b] = Array.from(ctx.getImageData(17, 5, 1, 1).data);
        expect(Math.min(r, g, b)).toBeGreaterThan(240);
    });

    it('loadImage: a file that is not an image is rejected', async () => {
        await expect(loadImage(new Blob(['not an image'], { type: 'image/png' }))).rejects.toThrowError('Not a readable image');
    });

    it('resizeImage: if the browser returns no Blob, the image is unreadable', async () => {
        const png = await makePng(20, 10);
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(null));
        await expect(resizeImage(png, 20)).rejects.toThrowError('Not a readable image');
        vi.restoreAllMocks();
    });
});
