import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { WIDTHS, ImagesData, DEFAULT_IMAGE } from './images-data';
import { provideHttpClient, withXhr } from '@angular/common/http';

// Images in R2 via the backend (sc-2911, sc-3052). Cloudinary has been gone since sc-3070.
describe('ImagesData', () => {
    const api = environment.apiV2Url;
    const r2 = { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' };
    let service: ImagesData;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
        service = TestBed.inject(ImagesData);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    describe('uploadImage', () => {
        it('a URL is sent as JSON {sourceUrl} and passes on {key, url}', () => {
            let image: unknown;
            service.uploadImage('https://x.be/a.jpg').subscribe(b => image = b);
            const req = http.expectOne(api + 'images');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ sourceUrl: 'https://x.be/a.jpg' });
            req.flush(r2);
            expect(image).toEqual(r2);
        });

        it('a resized photo is sent as a raw Blob with its own Content-Type', () => {
            const photo = new Blob(['jpeg'], { type: 'image/jpeg' });
            service.uploadImage(photo).subscribe();
            const req = http.expectOne(api + 'images');
            expect(req.request.body).toBe(photo);
            expect(req.request.detectContentTypeHeader()).toBe('image/jpeg');
            req.flush(r2);
        });

        it('without an image: null, no request', () => {
            let image: unknown = 'something';
            service.uploadImage(null).subscribe(b => image = b);
            expect(image).toBeNull();
        });
    });

    it('hasImage: only an R2 image with key and url', () => {
        expect(service.hasImage(r2)).toBe(true);
        expect(service.hasImage({ key: 'wishes/a.jpg' })).toBe(false);
        expect(service.hasImage({ url: 'https://img.gimmi.be/wishes/a.jpg' })).toBe(false);
        expect(service.hasImage({})).toBe(false);
        expect(service.hasImage(null)).toBe(false);
        expect(service.hasImage(undefined)).toBe(false);
    });

    it('src: transformation on the image domain, or the default image', () => {
        expect(service.src(r2, 320)).toBe('https://img.gimmi.be/cdn-cgi/image/width=320,fit=scale-down,format=auto/wishes/a.jpg');
        expect(service.src({ key: 'dev/wishes/b.png', url: 'https://img-test.gimmi.be/dev/wishes/b.png' }, 160))
            .toBe('https://img-test.gimmi.be/cdn-cgi/image/width=160,fit=scale-down,format=auto/dev/wishes/b.png');
        expect(service.src(null, 320)).toBe(DEFAULT_IMAGE);
    });

    // Image Transformations refuses AVIF as a source (sc-3231): then the original, without srcset.
    it('an AVIF image: the original without transformation and without srcset', () => {
        const avif = { key: 'wishes/c.avif', url: 'https://img.gimmi.be/wishes/c.avif' };
        expect(service.transformable(avif)).toBe(false);
        expect(service.transformable({ key: 'wishes/c.AVIF', url: 'https://img.gimmi.be/wishes/c.AVIF' })).toBe(false);
        expect(service.transformable(r2)).toBe(true);
        expect(service.transformable(null)).toBe(false);
        expect(service.src(avif, 320)).toBe(avif.url);
        expect(service.srcset(avif)).toBeNull();
    });

    it('srcset: every width with its w value, or null for the default image', () => {
        const parts = service.srcset(r2).split(', ');
        expect(parts.length).toBe(WIDTHS.length);
        expect(parts[0]).toBe(service.src(r2, WIDTHS[0]) + ' ' + WIDTHS[0] + 'w');
        expect(service.srcset(null)).toBeNull();
    });
});
