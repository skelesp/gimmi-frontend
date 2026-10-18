import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DeviceDetectorService } from 'ngx-device-detector';
import { of, Subject, throwError } from 'rxjs';

import { IWishImage } from 'src/app/wishes/models/wish.model';
import { environment } from 'src/environments/environment';
import { CloudinaryService } from '../../services/cloudinary.service';
import { IImageSearchResult, ImageSearchService } from '../../services/image-search.service';
import { boodschapVoor, ImageUploadComponent, MAX_BESTAND_BYTES } from './image-upload.component';

// De eigen afbeeldingskiezer (sc-3028): zoeken via Brave, foto/bestand opladen via de backend.
// Vervangt de Cloudinary-widget; netwerk en toestel worden nagebootst.
describe('ImageUploadComponent', () => {
  let fixture: ComponentFixture<ImageUploadComponent>;
  let component: ImageUploadComponent;
  let cloudinary: jasmine.SpyObj<CloudinaryService>;
  let zoekService: jasmine.SpyObj<ImageSearchService>;
  let toestel: jasmine.SpyObj<DeviceDetectorService>;
  let opgeladen: jasmine.Spy;

  const resultaat = (n: number): IImageSearchResult => ({
    url: `https://winkel.be/${n}.jpg`, thumbnail: `https://imgs.search.brave.com/${n}`,
    width: 100, height: 100, title: `Fiets ${n}`, source: 'winkel.be', page: null
  });
  const fout = (status: number, reason?: string) =>
    new HttpErrorResponse({ status, error: reason ? { error: 'x', reason } : null });

  function maak(opties: { publicId?: string; prefix?: string; zoekterm?: string } = {}) {
    fixture = TestBed.createComponent(ImageUploadComponent);
    component = fixture.componentInstance;
    if (opties.publicId) component.publicId = opties.publicId;
    if (opties.prefix) component.tempPublicId_prefix = opties.prefix;
    if (opties.zoekterm !== undefined) component.searchTerm = opties.zoekterm;
    opgeladen = jasmine.createSpy('imageUploaded');
    component.imageUploaded.subscribe(opgeladen);
    fixture.detectChanges();
  }
  const el = (css: string): HTMLElement => fixture.nativeElement.querySelector(css);
  const alle = (css: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(css));
  function klikKnop(tekst: string) {
    const knop = alle('button').find(b => b.textContent.trim() === tekst);
    expect(knop).withContext(`knop "${tekst}"`).toBeTruthy();
    knop.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    cloudinary = jasmine.createSpyObj<CloudinaryService>('CloudinaryService', ['uploadImage', 'generateRandomPublicId']);
    cloudinary.generateRandomPublicId.and.returnValue('ria-4242_temp');
    zoekService = jasmine.createSpyObj<ImageSearchService>('ImageSearchService', ['search']);
    zoekService.search.and.returnValue(of([resultaat(1), resultaat(2)]));
    toestel = jasmine.createSpyObj<DeviceDetectorService>('DeviceDetectorService', ['isMobile', 'isTablet']);
    toestel.isMobile.and.returnValue(false);
    toestel.isTablet.and.returnValue(false);
    await TestBed.configureTestingModule({
      declarations: [ImageUploadComponent],
      imports: [FormsModule],
      providers: [
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: ImageSearchService, useValue: zoekService },
        { provide: DeviceDetectorService, useValue: toestel }
      ]
    }).compileComponents();
  });

  describe('openen en sluiten', () => {
    it('dicht bij de start; "Kies afbeelding" opent de kiezer op de tab Zoeken', () => {
      maak();
      expect(el('#afbeeldingskiezer')).toBeNull();
      klikKnop('Kies afbeelding');
      expect(el('#afbeeldingskiezer')).not.toBeNull();
      expect(el('[role=tab].active').textContent.trim()).toBe('Zoeken');
      expect(el('button[aria-controls=afbeeldingskiezer]').getAttribute('aria-expanded')).toBe('true');
    });

    it('nogmaals "Kies afbeelding" of het kruisje sluit de kiezer', () => {
      maak();
      klikKnop('Kies afbeelding');
      klikKnop('Kies afbeelding');
      expect(el('#afbeeldingskiezer')).toBeNull();
      klikKnop('Kies afbeelding');
      (el('button[aria-label="Sluit afbeeldingskiezer"]')).click();
      fixture.detectChanges();
      expect(el('#afbeeldingskiezer')).toBeNull();
    });
  });

  describe('zoeken', () => {
    it('zoekt bij het openen meteen op de titel van de wens (sc-1330) en toont de resultaten', async () => {
      maak({ zoekterm: '  Rode fiets ' });
      klikKnop('Kies afbeelding');
      expect(zoekService.search).toHaveBeenCalledOnceWith('Rode fiets');
      await fixture.whenStable();   // ngModel schrijft het veld asynchroon
      expect((el('input[type=search]') as HTMLInputElement).value).toBe('Rode fiets');
      const beelden = alle('.resultaat img') as HTMLImageElement[];
      expect(beelden.map(i => i.src)).toEqual(['https://imgs.search.brave.com/1', 'https://imgs.search.brave.com/2']);
      expect(beelden[0].alt).toBe('Fiets 1');
      expect(fixture.nativeElement.textContent).toContain('Zoekresultaten van Brave Search');
    });

    it('een thumbnail die niet laadt, verdwijnt uit het raster', () => {
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      alle('.resultaat img')[0].dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect((alle('.resultaat img') as HTMLImageElement[]).map(i => i.alt)).toEqual(['Fiets 2']);
    });

    it('zonder titel: niet zoeken, wel een hint', () => {
      maak({ zoekterm: '' });
      klikKnop('Kies afbeelding');
      expect(zoekService.search).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('Geef een zoekterm in');
    });

    it('opnieuw openen met dezelfde titel zoekt niet opnieuw, met een nieuwe titel wel', () => {
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      klikKnop('Kies afbeelding');
      klikKnop('Kies afbeelding');
      expect(zoekService.search).toHaveBeenCalledTimes(1);
      component.searchTerm = 'step';
      klikKnop('Kies afbeelding');
      klikKnop('Kies afbeelding');
      expect(zoekService.search).toHaveBeenCalledTimes(2);
      expect(zoekService.search).toHaveBeenCalledWith('step');
    });

    it('een eigen zoekterm met Enter: zoekt en houdt de standaardactie (wens opslaan) tegen', fakeAsync(() => {
      maak();
      klikKnop('Kies afbeelding');
      const veld = el('input[type=search]') as HTMLInputElement;
      veld.value = 'blauwe step';
      veld.dispatchEvent(new Event('input'));
      tick();
      const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      veld.dispatchEvent(enter);
      fixture.detectChanges();
      expect(enter.defaultPrevented).toBeTrue();
      expect(zoekService.search).toHaveBeenCalledWith('blauwe step');
    }));

    it('de knop Zoek zoekt; een lege zoekterm doet niets', () => {
      maak();
      klikKnop('Kies afbeelding');
      klikKnop('Zoek');
      expect(zoekService.search).not.toHaveBeenCalled();
      component.zoekterm = 'bal';
      klikKnop('Zoek');
      expect(zoekService.search).toHaveBeenCalledWith('bal');
    });

    it('tijdens het zoeken: "Zoeken…" en de knop staat uit', () => {
      const lopend = new Subject<IImageSearchResult[]>();
      zoekService.search.and.returnValue(lopend);
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      expect(fixture.nativeElement.textContent).toContain('Zoeken…');
      expect((alle('button').find(b => b.textContent.trim() === 'Zoek') as HTMLButtonElement).disabled).toBeTrue();
      lopend.next([]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Geen afbeeldingen gevonden');
    });

    it('zoeken faalt: begrijpelijke melding met de reden van de backend', () => {
      zoekService.search.and.returnValue(throwError(fout(503, 'zoeken-niet-beschikbaar')));
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      expect(el('.alert').textContent).toContain('Zoeken lukt nu even niet. Je kunt wel een foto of bestand opladen.');
      expect(alle('.resultaat').length).toBe(0);
    });

    it('een nieuwe zoekopdracht breekt de vorige af', () => {
      const eerste = new Subject<IImageSearchResult[]>();
      zoekService.search.and.returnValues(eerste, of([resultaat(9)]));
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      component.zoekterm = 'step';
      component.zoek();   // de knop staat uit tijdens het zoeken; Enter in het veld kan wel
      fixture.detectChanges();
      expect(eerste.observers.length).toBe(0);
      expect(alle('.resultaat').length).toBe(1);
    });
  });

  describe('een zoekresultaat kiezen', () => {
    it('laadt de URL op onder de tijdelijke naam, geeft de afbeelding door en sluit de kiezer', () => {
      const nieuw: IWishImage = { publicId: 'ria-4242_temp', version: '7' };
      cloudinary.uploadImage.and.returnValue(of(nieuw));
      maak({ prefix: 'ria', zoekterm: 'fiets' });
      expect(cloudinary.generateRandomPublicId).toHaveBeenCalledWith('ria', environment.cloudinary.temporaryImagePostfix);
      klikKnop('Kies afbeelding');
      (alle('.resultaat')[1]).click();
      fixture.detectChanges();
      expect(cloudinary.uploadImage).toHaveBeenCalledWith('https://winkel.be/2.jpg', 'ria-4242_temp');
      expect(opgeladen).toHaveBeenCalledWith(nieuw);
      expect(el('#afbeeldingskiezer')).toBeNull();
    });

    it('met een publicId: die naam, geen tijdelijke', () => {
      cloudinary.uploadImage.and.returnValue(of({ publicId: 'wish_images/w1', version: '1' }));
      maak({ publicId: 'wish_images/w1', zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      alle('.resultaat')[0].click();
      expect(cloudinary.uploadImage).toHaveBeenCalledWith('https://winkel.be/1.jpg', 'wish_images/w1');
      expect(cloudinary.generateRandomPublicId).not.toHaveBeenCalled();
    });

    it('tijdens het opladen: draaiend wieltje op het gekozen resultaat, de andere staan uit', () => {
      cloudinary.uploadImage.and.returnValue(new Subject<IWishImage>());
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      alle('.resultaat')[0].click();
      fixture.detectChanges();
      const [eerste, tweede] = alle('.resultaat') as HTMLButtonElement[];
      expect(eerste.classList).toContain('bezig');
      expect(eerste.querySelector('.spinner-border')).not.toBeNull();
      expect(tweede.disabled).toBeTrue();
      component.kies(resultaat(2));
      expect(cloudinary.uploadImage).toHaveBeenCalledTimes(1);
    });

    it('de bronsite weigert (sc-2960): melding, resultaat uitgegrijsd, een ander kiezen kan', () => {
      cloudinary.uploadImage.and.returnValues(throwError(fout(422, 'bron-weigert')), of({ publicId: 'p', version: '2' }));
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      alle('.resultaat')[0].click();
      fixture.detectChanges();
      expect(el('.alert').textContent).toContain('Deze website laat niet toe dat we de afbeelding overnemen. Kies een andere.');
      const [eerste, tweede] = alle('.resultaat') as HTMLButtonElement[];
      expect(eerste.classList).toContain('mislukt');
      expect(eerste.disabled).toBeTrue();
      expect(opgeladen).not.toHaveBeenCalled();
      expect(el('#afbeeldingskiezer')).not.toBeNull();

      tweede.click();
      fixture.detectChanges();
      expect(opgeladen).toHaveBeenCalledWith({ publicId: 'p', version: '2' });
    });

    it('een mislukt resultaat opnieuw kiezen doet niets', () => {
      cloudinary.uploadImage.and.returnValue(throwError(fout(422, 'niet-gevonden')));
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      component.kies(resultaat(1));
      component.kies(resultaat(1));
      expect(cloudinary.uploadImage).toHaveBeenCalledTimes(1);
    });

    it('sluiten tijdens het opladen breekt de upload af (sc-1391)', () => {
      const upload = new Subject<IWishImage>();
      cloudinary.uploadImage.and.returnValue(upload);
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      alle('.resultaat')[0].click();
      expect(upload.observers.length).toBe(1);
      klikKnop('Kies afbeelding');
      expect(upload.observers.length).toBe(0);
      expect(component.bezigMet).toBeNull();
    });

    it('de popup sluit (component weg) tijdens zoeken en opladen: alles wordt afgebroken (sc-1391)', () => {
      const zoeken = new Subject<IImageSearchResult[]>();
      const upload = new Subject<IWishImage>();
      zoekService.search.and.returnValue(zoeken);
      cloudinary.uploadImage.and.returnValue(upload);
      maak({ zoekterm: 'fiets' });
      klikKnop('Kies afbeelding');
      component.kies(resultaat(1));
      fixture.destroy();
      expect(zoeken.observers.length).toBe(0);
      expect(upload.observers.length).toBe(0);
    });
  });

  describe('foto / bestand', () => {
    function pngBestand(naam = 'foto.png'): Promise<File> {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 20;
      canvas.getContext('2d').fillRect(0, 0, 40, 20);
      return new Promise(resolve => canvas.toBlob(b => resolve(new File([b], naam, { type: 'image/png' })), 'image/png'));
    }
    function kiesBestand(bestand: File): Promise<void> {
      const input = el('input[data-testid=bestand-kiezen]') as HTMLInputElement;
      const lijst = new DataTransfer();
      lijst.items.add(bestand);
      input.files = lijst.files;
      return component.bestandGekozen({ target: input } as unknown as Event);
    }
    function openBestandTab() {
      maak();
      klikKnop('Kies afbeelding');
      klikKnop('Foto / bestand');
    }

    it('op desktop alleen "Bestand kiezen", zonder capture', () => {
      openBestandTab();
      expect(alle('label').map(l => l.textContent.trim())).toEqual(['Bestand kiezen']);
      expect(el('input[type=file]').hasAttribute('capture')).toBeFalse();
      expect(el('input[type=file]').getAttribute('accept')).toBe('image/*');
    });

    it('op gsm of tablet ook "Foto nemen" met de camera achteraan', () => {
      toestel.isMobile.and.returnValue(true);
      openBestandTab();
      expect(alle('label').map(l => l.textContent.trim())).toEqual(['Foto nemen', 'Bestand kiezen']);
      expect(el('input[capture]').getAttribute('capture')).toBe('environment');
    });

    it('verkleint het bestand, laadt de JPEG op als data-URI en geeft de afbeelding door', async () => {
      cloudinary.uploadImage.and.returnValue(of({ publicId: 'ria-4242_temp', version: '3' }));
      openBestandTab();
      await kiesBestand(await pngBestand());
      const [image, publicId] = cloudinary.uploadImage.calls.mostRecent().args;
      expect(image.startsWith('data:image/jpeg;base64,')).toBeTrue();
      expect(publicId).toBe('ria-4242_temp');
      expect(opgeladen).toHaveBeenCalledWith({ publicId: 'ria-4242_temp', version: '3' });
      expect((el('input[data-testid=bestand-kiezen]') as HTMLInputElement)?.value || '').toBe('');
    });

    it('opladen faalt: melding, kiezer blijft open', async () => {
      cloudinary.uploadImage.and.returnValue(throwError(fout(413)));
      openBestandTab();
      await kiesBestand(await pngBestand());
      fixture.detectChanges();
      expect(el('.alert').textContent).toContain('Deze afbeelding is te groot.');
      expect(component.bezigMet).toBeNull();
      expect(component.open).toBeTrue();
    });

    it('geen afbeelding (bv. een pdf): melding, niets opgeladen', async () => {
      openBestandTab();
      await kiesBestand(new File(['%PDF'], 'x.pdf', { type: 'application/pdf' }));
      fixture.detectChanges();
      expect(el('.alert').textContent).toContain('Dit bestand is geen bruikbare afbeelding.');
      expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    });

    it('groter dan 30 MB: melding, niets opgeladen', async () => {
      openBestandTab();
      const groot = new File([new Uint8Array(1)], 'groot.jpg', { type: 'image/jpeg' });
      Object.defineProperty(groot, 'size', { value: MAX_BESTAND_BYTES + 1 });
      await kiesBestand(groot);
      expect(component.uploadFout).toContain('te groot');
      expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    });

    it('onleesbare afbeelding: melding, niets opgeladen', async () => {
      openBestandTab();
      await kiesBestand(new File(['kapot'], 'kapot.jpg', { type: 'image/jpeg' }));
      expect(component.uploadFout).toContain('kunnen we niet lezen');
      expect(component.bezigMet).toBeNull();
      expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    });

    it('geen bestand gekozen (dialoog geannuleerd): niets', async () => {
      openBestandTab();
      const input = el('input[data-testid=bestand-kiezen]') as HTMLInputElement;
      await component.bestandGekozen({ target: input } as unknown as Event);
      expect(component.uploadFout).toBeNull();
      expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    });

    it('popup gesloten tijdens het verkleinen: er wordt niets meer opgeladen', async () => {
      openBestandTab();
      const bezig = kiesBestand(await pngBestand());
      fixture.destroy();
      await bezig;
      expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    });

    it('wisselen van tab wist een oude foutmelding', async () => {
      openBestandTab();
      await kiesBestand(new File(['%PDF'], 'x.pdf', { type: 'application/pdf' }));
      klikKnop('Zoeken');
      expect(el('.alert')).toBeNull();
    });
  });

  describe('boodschapVoor', () => {
    it('kent elke reden van de backend', () => {
      for (const reason of ['bron-weigert', 'niet-gevonden', 'geen-afbeelding', 'ongeldige-url', 'ongeldige-afbeelding',
        'te-groot', 'onbereikbaar', 'rate-limit', 'zoeken-niet-beschikbaar']) {
        expect(boodschapVoor(fout(422, reason))).not.toBe('Er ging iets mis. Probeer het opnieuw.');
      }
    });
    it('onbekende reden, geen reden of netwerkfout: algemene melding', () => {
      expect(boodschapVoor(fout(422, 'iets-nieuws'))).toBe('Er ging iets mis. Probeer het opnieuw.');
      expect(boodschapVoor(fout(500))).toBe('Er ging iets mis. Probeer het opnieuw.');
      expect(boodschapVoor(fout(0))).toBe('Er ging iets mis. Probeer het opnieuw.');
    });
  });
});
