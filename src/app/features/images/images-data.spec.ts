import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { BREEDTES, ImagesData, STANDAARD_AFBEELDING } from './images-data';
import { provideHttpClient, withXhr } from '@angular/common/http';

// Afbeeldingen in R2 via de backend (sc-2911, sc-3052). Cloudinary is weg sinds sc-3070.
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
        it('een URL gaat als JSON {sourceUrl} en geeft {key, url} door', () => {
            let beeld: any;
            service.uploadImage('https://x.be/a.jpg').subscribe(b => beeld = b);
            const req = http.expectOne(api + 'images');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ sourceUrl: 'https://x.be/a.jpg' });
            req.flush(r2);
            expect(beeld).toEqual(r2);
        });

        it('een verkleinde foto gaat als ruwe Blob met zijn eigen Content-Type', () => {
            const foto = new Blob(['jpeg'], { type: 'image/jpeg' });
            service.uploadImage(foto).subscribe();
            const req = http.expectOne(api + 'images');
            expect(req.request.body).toBe(foto);
            expect(req.request.detectContentTypeHeader()).toBe('image/jpeg');
            req.flush(r2);
        });

        it('zonder afbeelding: null, geen request', () => {
            let beeld: any = 'iets';
            service.uploadImage(null).subscribe(b => beeld = b);
            expect(beeld).toBeNull();
        });
    });

    it('heeftBeeld: alleen een R2-beeld met sleutel en url', () => {
        expect(service.heeftBeeld(r2)).toBe(true);
        expect(service.heeftBeeld({ key: 'wishes/a.jpg' })).toBe(false);
        expect(service.heeftBeeld({ url: 'https://img.gimmi.be/wishes/a.jpg' })).toBe(false);
        expect(service.heeftBeeld({})).toBe(false);
        expect(service.heeftBeeld(null)).toBe(false);
        expect(service.heeftBeeld(undefined)).toBe(false);
    });

    it('src: transformatie op het beelddomein, of de standaardafbeelding', () => {
        expect(service.src(r2, 320)).toBe('https://img.gimmi.be/cdn-cgi/image/width=320,fit=scale-down,format=auto/wishes/a.jpg');
        expect(service.src({ key: 'dev/wishes/b.png', url: 'https://img-test.gimmi.be/dev/wishes/b.png' }, 160))
            .toBe('https://img-test.gimmi.be/cdn-cgi/image/width=160,fit=scale-down,format=auto/dev/wishes/b.png');
        expect(service.src(null, 320)).toBe(STANDAARD_AFBEELDING);
    });

    // Image Transformations weigert AVIF als bron (sc-3231): dan het origineel, zonder srcset.
    it('een AVIF-beeld: het origineel zonder transformatie en zonder srcset', () => {
        const avif = { key: 'wishes/c.avif', url: 'https://img.gimmi.be/wishes/c.avif' };
        expect(service.transformeerbaar(avif)).toBe(false);
        expect(service.transformeerbaar({ key: 'wishes/c.AVIF', url: 'https://img.gimmi.be/wishes/c.AVIF' })).toBe(false);
        expect(service.transformeerbaar(r2)).toBe(true);
        expect(service.transformeerbaar(null)).toBe(false);
        expect(service.src(avif, 320)).toBe(avif.url);
        expect(service.srcset(avif)).toBeNull();
    });

    it('srcset: elke breedte met zijn w-waarde, of null voor de standaardafbeelding', () => {
        const delen = service.srcset(r2).split(', ');
        expect(delen.length).toBe(BREEDTES.length);
        expect(delen[0]).toBe(service.src(r2, BREEDTES[0]) + ' ' + BREEDTES[0] + 'w');
        expect(service.srcset(null)).toBeNull();
    });
});
