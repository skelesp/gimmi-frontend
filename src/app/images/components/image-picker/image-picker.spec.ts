
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbAlertModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DeviceDetectorService } from 'ngx-device-detector';
import { of, Subject, throwError } from 'rxjs';

import { IWishImage } from 'src/app/wishes/models/wish.model';
import { ImageService } from '../../services/image.service';
import { IImageSearchResult, ImageSearchService } from '../../services/image-search.service';
import { boodschapVoor, ImagePicker, MAX_BESTAND_BYTES } from './image-picker';

// De eigen afbeeldingskiezer als popup (sc-3028): zoeken via Brave, foto/bestand opladen via
// de backend naar R2 (sc-2911). Vervangt de Cloudinary-widget; netwerk, toestel en popup worden nagebootst.
describe('ImagePicker', () => {
    let fixture: ComponentFixture<ImagePicker>;
    let component: ImagePicker;
    let beelden: Record<string, any>;
    let zoekService: Record<string, any>;
    let toestel: Record<string, any>;
    let modal: Record<string, any>;

    const resultaat = (n: number): IImageSearchResult => ({
        url: `https://winkel.be/${n}.jpg`, thumbnail: `https://imgs.search.brave.com/${n}`,
        width: 100, height: 100, title: `Fiets ${n}`, source: 'winkel.be', page: null
    });
    const fout = (status: number, reason?: string) => new HttpErrorResponse({ status, error: reason ? { error: 'x', reason } : null });

    async function maak(opties: {
        zoekterm?: string;
    } = {}) {
        fixture = TestBed.createComponent(ImagePicker);
        component = fixture.componentInstance;
        if (opties.zoekterm !== undefined)
            component.searchTerm = opties.zoekterm;
        await fixture.whenStable();
    }
    const el = (css: string): HTMLElement => fixture.nativeElement.querySelector(css);
    const alle = (css: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(css));
    const tekst = () => fixture.nativeElement.textContent as string;
    async function klik(knoptekst: string) {
        const knop = alle('button, a').find(b => b.textContent.trim() === knoptekst);
        expect(knop, `knop "${knoptekst}"`).toBeTruthy();
        knop.click();
        await fixture.whenStable();
    }

    beforeEach(async () => {
        beelden = {
            uploadImage: vi.fn().mockName("ImageService.uploadImage")
        };
        zoekService = {
            search: vi.fn().mockName("ImageSearchService.search")
        };
        zoekService.search.mockReturnValue(of([resultaat(1), resultaat(2)]));
        toestel = {
            isMobile: vi.fn().mockName("DeviceDetectorService.isMobile"),
            isTablet: vi.fn().mockName("DeviceDetectorService.isTablet")
        };
        toestel.isMobile.mockReturnValue(false);
        toestel.isTablet.mockReturnValue(false);
        modal = {
            close: vi.fn().mockName("NgbActiveModal.close"),
            dismiss: vi.fn().mockName("NgbActiveModal.dismiss")
        };
        await TestBed.configureTestingModule({
    imports: [FormsModule, NgbNavModule, NgbAlertModule, ImagePicker],
    providers: [
        { provide: ImageService, useValue: beelden },
        { provide: ImageSearchService, useValue: zoekService },
        { provide: DeviceDetectorService, useValue: toestel },
        { provide: NgbActiveModal, useValue: modal }
    ]
}).compileComponents();
    });

    describe('popup', () => {
        it('titel "Kies een afbeelding", start op de tab Zoeken', async () => {
            await maak();
            expect(el('.modal-title').textContent.trim()).toBe('Kies een afbeelding');
            expect(el('#kiezer-titel')).not.toBeNull();
            expect(el('.nav-link.active').textContent.trim()).toBe('Zoeken');
        });

        it('Annuleer en het kruisje sluiten de popup zonder resultaat', async () => {
            await maak();
            await klik('Annuleer');
            (el('.modal-header .btn-close')).click();
            expect(modal.dismiss).toHaveBeenCalledTimes(2);
            expect(modal.close).not.toHaveBeenCalled();
        });
    });

    describe('zoeken', () => {
        it('zoekt meteen op de titel van de wens (sc-1330) en toont de resultaten', async () => {
            await maak({ zoekterm: '  Rode fiets ' });
            expect(zoekService.search).toHaveBeenCalledTimes(1);
            expect(zoekService.search).toHaveBeenCalledWith('Rode fiets');
            await fixture.whenStable(); // ngModel schrijft het veld asynchroon
            expect((el('input[type=search]') as HTMLInputElement).value).toBe('Rode fiets');
            const beelden = alle('.resultaat img') as HTMLImageElement[];
            expect(beelden.map(i => i.src)).toEqual(['https://imgs.search.brave.com/1', 'https://imgs.search.brave.com/2']);
            expect(beelden[0].alt).toBe('Fiets 1');
            expect(tekst()).toContain('Zoekresultaten van Brave Search');
        });

        it('een thumbnail die niet laadt, verdwijnt uit het raster', async () => {
            await maak({ zoekterm: 'fiets' });
            alle('.resultaat img')[0].dispatchEvent(new Event('error'));
            await fixture.whenStable();
            expect((alle('.resultaat img') as HTMLImageElement[]).map(i => i.alt)).toEqual(['Fiets 2']);
        });

        it('zonder titel: niet zoeken, wel een hint', async () => {
            await maak({ zoekterm: '' });
            expect(zoekService.search).not.toHaveBeenCalled();
            expect(tekst()).toContain('Geef een zoekterm in');
        });

        it('een eigen zoekterm met Enter: zoekt en houdt de standaardactie tegen', async () => {
            await maak();
            await fixture.whenStable();
            const veld = el('input[type=search]') as HTMLInputElement;
            veld.value = 'blauwe step';
            veld.dispatchEvent(new Event('input'));
            const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
            veld.dispatchEvent(enter);
            await fixture.whenStable();
            expect(enter.defaultPrevented).toBe(true);
            expect(zoekService.search).toHaveBeenCalledWith('blauwe step');
        });

        it('de knop Zoek zoekt; een lege zoekterm doet niets', async () => {
            await maak();
            await klik('Zoek');
            expect(zoekService.search).not.toHaveBeenCalled();
            component.zoekterm = 'bal';
            await klik('Zoek');
            expect(zoekService.search).toHaveBeenCalledWith('bal');
        });

        it('tijdens het zoeken: draaiend wieltje en de knop staat uit', async () => {
            const lopend = new Subject<IImageSearchResult[]>();
            zoekService.search.mockReturnValue(lopend);
            await maak({ zoekterm: 'fiets' });
            expect(el('.spinner-border')).not.toBeNull();
            expect((alle('button').find(b => b.textContent.trim() === 'Zoek') as HTMLButtonElement).disabled).toBe(true);
            lopend.next([]);
            await fixture.whenStable();
            expect(tekst()).toContain('Geen afbeeldingen gevonden');
        });

        it('zoeken faalt: begrijpelijke melding met de reden van de backend', async () => {
            zoekService.search.mockReturnValue(throwError(fout(503, 'zoeken-niet-beschikbaar')));
            await maak({ zoekterm: 'fiets' });
            expect(el('ngb-alert').textContent).toContain('Zoeken lukt nu even niet. Je kunt wel een foto of bestand opladen.');
            expect(alle('.resultaat').length).toBe(0);
        });

        it('een nieuwe zoekopdracht breekt de vorige af', async () => {
            const eerste = new Subject<IImageSearchResult[]>();
            zoekService.search.mockReturnValueOnce(eerste).mockReturnValueOnce(of([resultaat(9)]));
            await maak({ zoekterm: 'fiets' });
            component.zoekterm = 'step';
            component.zoek();
            await fixture.whenStable();
            expect(eerste.observers.length).toBe(0);
            expect(alle('.resultaat').length).toBe(1);
        });
    });

    describe('een zoekresultaat kiezen', () => {
        it('laadt de URL op en sluit met de afbeelding en de thumbnail als voorvertoning', async () => {
            const nieuw: IWishImage = { key: 'wishes/a.jpg', url: 'https://img-test.gimmi.be/wishes/a.jpg' };
            beelden.uploadImage.mockReturnValue(of(nieuw));
            await maak({ zoekterm: 'fiets' });
            alle('.resultaat')[1].click();
            expect(beelden.uploadImage).toHaveBeenCalledWith('https://winkel.be/2.jpg');
            expect(modal.close).toHaveBeenCalledWith({ afbeelding: nieuw, voorvertoning: 'https://imgs.search.brave.com/2' });
        });

        it('tijdens het opladen: wieltje op het gekozen resultaat, de andere staan uit', async () => {
            beelden.uploadImage.mockReturnValue(new Subject<IWishImage>());
            await maak({ zoekterm: 'fiets' });
            alle('.resultaat')[0].click();
            await fixture.whenStable();
            const [eerste, tweede] = alle('.resultaat') as HTMLButtonElement[];
            expect(eerste.classList).toContain('bezig');
            expect(eerste.querySelector('.spinner-border')).not.toBeNull();
            expect(tweede.disabled).toBe(true);
            component.kies(resultaat(2));
            expect(beelden.uploadImage).toHaveBeenCalledTimes(1);
        });

        it('de bronsite weigert (sc-2960): melding, resultaat uitgegrijsd, een ander kiezen kan', async () => {
            beelden.uploadImage.mockReturnValueOnce(throwError(fout(422, 'bron-weigert'))).mockReturnValueOnce(of({ key: 'wishes/p.jpg', url: 'u' }));
            await maak({ zoekterm: 'fiets' });
            alle('.resultaat')[0].click();
            await fixture.whenStable();
            expect(el('ngb-alert').textContent).toContain('Deze website laat niet toe dat we de afbeelding overnemen. Kies een andere.');
            const [eerste, tweede] = alle('.resultaat') as HTMLButtonElement[];
            expect(eerste.classList).toContain('mislukt');
            expect(eerste.disabled).toBe(true);
            expect(modal.close).not.toHaveBeenCalled();

            tweede.click();
            expect(modal.close).toHaveBeenCalledWith({ afbeelding: { key: 'wishes/p.jpg', url: 'u' }, voorvertoning: 'https://imgs.search.brave.com/2' });
        });

        it('een mislukt resultaat opnieuw kiezen doet niets', async () => {
            beelden.uploadImage.mockReturnValue(throwError(fout(422, 'niet-gevonden')));
            await maak({ zoekterm: 'fiets' });
            component.kies(resultaat(1));
            component.kies(resultaat(1));
            expect(beelden.uploadImage).toHaveBeenCalledTimes(1);
        });

        it('popup weg tijdens zoeken en opladen: alles wordt afgebroken (sc-1391)', async () => {
            const zoeken = new Subject<IImageSearchResult[]>();
            const upload = new Subject<IWishImage>();
            zoekService.search.mockReturnValue(zoeken);
            beelden.uploadImage.mockReturnValue(upload);
            await maak({ zoekterm: 'fiets' });
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
        async function openBestandTab() {
            await maak();
            await klik('Foto / bestand');
        }

        it('op desktop alleen "Bestand kiezen" (rode hoofdknop), zonder capture', async () => {
            await openBestandTab();
            const labels = alle('label');
            expect(labels.map(l => l.textContent.trim())).toEqual(['Bestand kiezen']);
            expect(labels[0].classList).toContain('btn-danger');
            expect(el('input[type=file]').hasAttribute('capture')).toBe(false);
            expect(el('input[type=file]').getAttribute('accept')).toBe('image/*');
        });

        it('op gsm of tablet eerst "Foto nemen" met de camera achteraan', async () => {
            toestel.isTablet.mockReturnValue(true);
            await openBestandTab();
            const labels = alle('label');
            expect(labels.map(l => l.textContent.trim())).toEqual(['Foto nemen', 'Bestand kiezen']);
            expect(labels[1].classList).toContain('btn-outline-danger');
            expect(el('input[capture]').getAttribute('capture')).toBe('environment');
        });

        it('verkleint het bestand, laadt de JPEG op als data-URI en sluit met de afbeelding en die data-URI als voorvertoning', async () => {
            beelden.uploadImage.mockReturnValue(of({ key: 'wishes/f.jpg', url: 'u' }));
            await openBestandTab();
            await kiesBestand(await pngBestand());
            const [image] = vi.mocked(beelden.uploadImage).mock.lastCall;
            expect(image.startsWith('data:image/jpeg;base64,')).toBe(true);
            expect(modal.close).toHaveBeenCalledWith({ afbeelding: { key: 'wishes/f.jpg', url: 'u' }, voorvertoning: image });
        });

        it('tijdens het opladen: "Bezig met opladen…"', async () => {
            beelden.uploadImage.mockReturnValue(new Subject<IWishImage>());
            await openBestandTab();
            await kiesBestand(await pngBestand());
            await fixture.whenStable();
            expect(tekst()).toContain('Bezig met opladen…');
        });

        it('opladen faalt: melding, popup blijft open', async () => {
            beelden.uploadImage.mockReturnValue(throwError(fout(413)));
            await openBestandTab();
            await kiesBestand(await pngBestand());
            await fixture.whenStable();
            expect(el('ngb-alert').textContent).toContain('Deze afbeelding is te groot.');
            expect(component.bezigMet()).toBeNull();
            expect(modal.close).not.toHaveBeenCalled();
        });

        it('geen afbeelding (bv. een pdf): melding, niets opgeladen', async () => {
            await openBestandTab();
            await kiesBestand(new File(['%PDF'], 'x.pdf', { type: 'application/pdf' }));
            await fixture.whenStable();
            expect(el('ngb-alert').textContent).toContain('Dit bestand is geen bruikbare afbeelding.');
            expect(beelden.uploadImage).not.toHaveBeenCalled();
        });

        it('groter dan 30 MB: melding, niets opgeladen', async () => {
            await openBestandTab();
            const groot = new File([new Uint8Array(1)], 'groot.jpg', { type: 'image/jpeg' });
            Object.defineProperty(groot, 'size', { value: MAX_BESTAND_BYTES + 1 });
            await kiesBestand(groot);
            expect(component.uploadFout()).toContain('te groot');
            expect(beelden.uploadImage).not.toHaveBeenCalled();
        });

        it('onleesbare afbeelding: melding, niets opgeladen', async () => {
            await openBestandTab();
            await kiesBestand(new File(['kapot'], 'kapot.jpg', { type: 'image/jpeg' }));
            expect(component.uploadFout()).toContain('kunnen we niet lezen');
            expect(component.bezigMet()).toBeNull();
            expect(beelden.uploadImage).not.toHaveBeenCalled();
        });

        it('geen bestand gekozen (dialoog geannuleerd): niets', async () => {
            await openBestandTab();
            const input = el('input[data-testid=bestand-kiezen]') as HTMLInputElement;
            await component.bestandGekozen({ target: input } as unknown as Event);
            expect(component.uploadFout()).toBeNull();
            expect(beelden.uploadImage).not.toHaveBeenCalled();
        });

        it('popup gesloten tijdens het verkleinen: er wordt niets meer opgeladen', async () => {
            await openBestandTab();
            const bezig = kiesBestand(await pngBestand());
            fixture.destroy();
            await bezig;
            expect(beelden.uploadImage).not.toHaveBeenCalled();
        });

        it('wisselen van tab wist een oude foutmelding', async () => {
            await openBestandTab();
            await kiesBestand(new File(['%PDF'], 'x.pdf', { type: 'application/pdf' }));
            await fixture.whenStable();
            await klik('Zoeken');
            expect(el('ngb-alert')).toBeNull();
        });
    });

    describe('boodschapVoor', () => {
        it('kent elke reden van de backend', async () => {
            for (const reason of ['bron-weigert', 'niet-gevonden', 'geen-afbeelding', 'ongeldige-url', 'ongeldige-afbeelding',
                'te-groot', 'onbereikbaar', 'rate-limit', 'zoeken-niet-beschikbaar']) {
                expect(boodschapVoor(fout(422, reason))).not.toBe('Er ging iets mis. Probeer het opnieuw.');
            }
        });
        it('onbekende reden, geen reden of netwerkfout: algemene melding', async () => {
            expect(boodschapVoor(fout(422, 'iets-nieuws'))).toBe('Er ging iets mis. Probeer het opnieuw.');
            expect(boodschapVoor(fout(500))).toBe('Er ging iets mis. Probeer het opnieuw.');
            expect(boodschapVoor(fout(0))).toBe('Er ging iets mis. Probeer het opnieuw.');
        });
    });
});
