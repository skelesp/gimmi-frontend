import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { CloudinaryService } from './cloudinary.service';

// Afbeeldingen via de eigen API (sc-1999, sc-2358, sc-2364, sc-2618), en het laden van de
// upload-widget: het externe script zelf wordt nooit echt opgehaald.
describe('CloudinaryService', () => {
  const api = environment.apiUrl;
  let service: CloudinaryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CloudinaryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getSignature: vraagt een handtekening en geeft die aan de callback', () => {
    let handtekening: string;
    service.getSignature((s: string) => handtekening = s, { public_id: 'x' });
    const req = http.expectOne(api + 'images/signature');
    expect(req.request.body).toEqual({ public_id: 'x' });
    req.flush('abc123');
    expect(handtekening).toBe('abc123');
  });

  describe('uploadImage', () => {
    it('post url en public_id en zet het antwoord om naar publicId/version', () => {
      let beeld: any;
      service.uploadImage('https://x.be/a.jpg', 'w1-5_tmp').subscribe(b => beeld = b);
      const req = http.expectOne(api + 'images');
      expect(req.request.body).toEqual({ public_id: 'w1-5_tmp', image: 'https://x.be/a.jpg' });
      req.flush({ public_id: 'w1-5_tmp', version: '9' });
      expect(beeld).toEqual({ publicId: 'w1-5_tmp', version: '9' });
    });

    it('zonder url: null, geen request', () => {
      let beeld: any = 'iets';
      service.uploadImage(null, 'x').subscribe(b => beeld = b);
      expect(beeld).toBeNull();
    });
  });

  it('renameImage: PUT met gecodeerde public id en de nieuwe naam', () => {
    let beeld: any;
    service.renameImage('map/tmp 1', 'w1').subscribe(b => beeld = b);
    const req = http.expectOne(api + 'images/map%2Ftmp%201/public_id');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ new_public_id: 'w1' });
    req.flush({ public_id: 'map/w1', version: 3 });
    expect(beeld).toEqual({ publicId: 'map/w1', version: 3 });
  });

  describe('deleteImage', () => {
    it('verwijdert via de API: true als de API "ok" meldt', () => {
      let ok: boolean;
      service.deleteImage({ publicId: 'map/w1', version: '1' }).subscribe(r => ok = r);
      const req = http.expectOne(api + 'images/map%2Fw1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ delete: 'ok' });
      expect(ok).toBeTrue();
    });

    it('fout van de API: false', () => {
      spyOn(console, 'error');
      let ok: boolean;
      service.deleteImage({ publicId: 'weg', version: '1' }).subscribe(r => ok = r);
      http.expectOne(api + 'images/weg').flush('niet gevonden', { status: 500, statusText: 'Error' });
      expect(ok).toBeFalse();
    });

    it('geen afbeelding of de standaardafbeelding: false, geen request', () => {
      const resultaten: boolean[] = [];
      service.deleteImage(undefined).subscribe(r => resultaten.push(r));
      service.deleteImage({ publicId: environment.cloudinary.defaultImage.publicId, version: '1' }).subscribe(r => resultaten.push(r));
      expect(resultaten).toEqual([false, false]);
    });
  });

  it('generateRandomPublicId: prefix, getal en postfix', () => {
    expect(service.generateRandomPublicId('w1', '_tmp')).toMatch(/^w1-\d{1,7}_tmp$/);
  });

  it('generateCloudinaryUrl: url met cloud, versie en public id; zonder afbeelding null', () => {
    expect(service.generateCloudinaryUrl({ publicId: 'w1', version: '7' }))
      .toBe(`https://res.cloudinary.com/${environment.cloudinary.cloud_name}/image/upload/v7/w1`);
    expect(service.generateCloudinaryUrl(null)).toBeNull();
  });

  it('isTemporaryImage: herkent de tijdelijke postfix', () => {
    const postfix = environment.cloudinary.temporaryImagePostfix;
    expect(service.isTemporaryImage({ publicId: 'w1-123' + postfix, version: '1' })).toBeTrue();
    expect(service.isTemporaryImage({ publicId: 'w1', version: '1' })).toBeFalse();
  });

  describe('createUploadWidget', () => {
    const widgetUrl = 'https://widget.cloudinary.com/v2.0/global/all.js';
    let echteCloudinary: any;

    beforeEach(() => {
      echteCloudinary = (window as any).cloudinary;
      (window as any).cloudinary = { createUploadWidget: jasmine.createSpy('createUploadWidget').and.returnValue('widget') };
    });

    afterEach(() => {
      (window as any).cloudinary = echteCloudinary;
      document.querySelectorAll(`script[src="${widgetUrl}"]`).forEach(s => s.remove());
    });

    it('script nog niet geladen: voegt het één keer toe en maakt de widget zodra het geladen is', () => {
      const appendChild = spyOn(document.body, 'appendChild').and.callFake((s: any) => s);
      const callback = () => {};
      let widget: any;
      service.createUploadWidget({ cloud_name: 'x' }, callback).subscribe(w => widget = w);

      const script = appendChild.calls.mostRecent().args[0] as HTMLScriptElement;
      expect(script.src).toBe(widgetUrl);
      expect(script.type).toBe('text/javascript');
      expect(widget).toBeUndefined();

      script.dispatchEvent(new Event('load'));
      expect((window as any).cloudinary.createUploadWidget).toHaveBeenCalledWith({ cloud_name: 'x' }, callback);
      expect(widget).toBe('widget');
    });

    it('script al aanwezig: geen tweede script, meteen de widget', () => {
      const bestaand = document.createElement('script');
      bestaand.setAttribute('src', widgetUrl);
      document.head.appendChild(bestaand);
      const appendChild = spyOn(document.body, 'appendChild').and.callThrough();
      let widget: any;
      service.createUploadWidget({}, () => {}).subscribe(w => widget = w);
      expect(appendChild).not.toHaveBeenCalled();
      expect(widget).toBe('widget');
    });
  });
});
