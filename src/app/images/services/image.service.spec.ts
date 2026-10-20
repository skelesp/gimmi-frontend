import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { BREEDTES, ImageService, STANDAARD_AFBEELDING } from './image.service';

// Afbeeldingen in R2 via de backend (sc-2911, sc-3052), met Cloudinary als terugval
// voor beelden die nog niet gemigreerd zijn (sc-3065).
describe('ImageService', () => {
  const api = environment.apiUrl;
  const cloud = environment.cloudinary.cloud_name;
  const r2 = { key: 'wishes/a.jpg', url: 'https://img.gimmi.be/wishes/a.jpg' };
  const oud = { publicId: 'wish_images/w1', version: '3' };
  let service: ImageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ImageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('uploadImage', () => {
    it('post alleen de afbeelding (geen public_id: dan kiest de backend R2) en geeft {key, url} door', () => {
      let beeld: any;
      service.uploadImage('https://x.be/a.jpg').subscribe(b => beeld = b);
      const req = http.expectOne(api + 'images');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ image: 'https://x.be/a.jpg' });
      req.flush(r2);
      expect(beeld).toEqual(r2);
    });

    it('zonder afbeelding: null, geen request', () => {
      let beeld: any = 'iets';
      service.uploadImage(null).subscribe(b => beeld = b);
      expect(beeld).toBeNull();
    });
  });

  it('heeftBeeld: R2 en Cloudinary wel, leeg en de oude Cloudinary-standaardafbeelding niet', () => {
    expect(service.heeftBeeld(r2)).toBeTrue();
    expect(service.heeftBeeld(oud)).toBeTrue();
    expect(service.heeftBeeld({ publicId: 'wish_images/default', version: '1556702046' })).toBeFalse();
    expect(service.heeftBeeld({ key: 'wishes/a.jpg' })).toBeFalse();
    expect(service.heeftBeeld(null)).toBeFalse();
    expect(service.heeftBeeld(undefined)).toBeFalse();
  });

  it('origineel: de url van R2, de volledige Cloudinary-URL, of null', () => {
    expect(service.origineel(r2)).toBe(r2.url);
    expect(service.origineel(oud)).toBe(`https://res.cloudinary.com/${cloud}/image/upload/v3/wish_images/w1`);
    expect(service.origineel(null)).toBeNull();
  });

  it('src: transformatie op het beelddomein voor R2, Cloudinary-transformatie, of de standaardafbeelding', () => {
    expect(service.src(r2, 320)).toBe('https://img.gimmi.be/cdn-cgi/image/width=320,fit=scale-down,format=auto/wishes/a.jpg');
    expect(service.src({ key: 'dev/wishes/b.png', url: 'https://img-test.gimmi.be/dev/wishes/b.png' }, 160))
      .toBe('https://img-test.gimmi.be/cdn-cgi/image/width=160,fit=scale-down,format=auto/dev/wishes/b.png');
    expect(service.src(oud, 320)).toBe(`https://res.cloudinary.com/${cloud}/image/upload/f_auto,c_limit,w_320/v3/wish_images/w1`);
    expect(service.src(null, 320)).toBe(STANDAARD_AFBEELDING);
  });

  it('srcset: elke breedte met zijn w-waarde, of null voor de standaardafbeelding', () => {
    const delen = service.srcset(r2).split(', ');
    expect(delen.length).toBe(BREEDTES.length);
    expect(delen[0]).toBe(service.src(r2, BREEDTES[0]) + ' ' + BREEDTES[0] + 'w');
    expect(service.srcset(null)).toBeNull();
  });
});
