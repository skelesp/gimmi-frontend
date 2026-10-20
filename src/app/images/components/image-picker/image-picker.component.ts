import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Subscription } from 'rxjs';
import { IWishImage } from 'src/app/wishes/models/wish.model';
import { CloudinaryService } from '../../services/cloudinary.service';
import { IImageSearchResult, ImageSearchService } from '../../services/image-search.service';
import { verkleinAfbeelding } from '../../utils/resize-image';

export type KiezerTab = 'zoeken' | 'bestand';

/**
 * Resultaat van de kiezer: de opgeladen afbeelding, en een voorvertoning die de browser
 * al heeft (thumbnail van het zoekresultaat of de verkleinde foto). Zo kan de wens-popup
 * de nieuwe afbeelding meteen tonen, zonder te wachten tot Cloudinary ze levert.
 */
export interface IGekozenAfbeelding {
  afbeelding: IWishImage;
  voorvertoning: string;
}

/** Grootste bestand dat we nog proberen te verkleinen; een foto van een gsm is zelden groter. */
export const MAX_BESTAND_BYTES = 30 * 1024 * 1024;

const BESTAND = 'bestand';

// Uitleg per `reason` van de backend (sc-2960, sc-3028).
const BOODSCHAPPEN: { [reason: string]: string } = {
  'bron-weigert': 'Deze website laat niet toe dat we de afbeelding overnemen. Kies een andere.',
  'niet-gevonden': 'Deze afbeelding bestaat niet meer. Kies een andere.',
  'geen-afbeelding': 'Dit resultaat is geen bruikbare afbeelding. Kies een andere.',
  'ongeldige-url': 'Dit resultaat is geen bruikbare afbeelding. Kies een andere.',
  'ongeldige-afbeelding': 'Dit bestand is geen bruikbare afbeelding.',
  'te-groot': 'Deze afbeelding is te groot. Kies een andere.',
  'onbereikbaar': 'De website van deze afbeelding reageert niet. Kies een andere.',
  'rate-limit': 'Je hebt veel gezocht op korte tijd. Wacht een minuutje en probeer opnieuw.',
  'zoeken-niet-beschikbaar': 'Zoeken lukt nu even niet. Je kunt wel een foto of bestand opladen.'
};
const ALGEMENE_FOUT = 'Er ging iets mis. Probeer het opnieuw.';

export function boodschapVoor(err: HttpErrorResponse): string {
  const reason = err?.error?.reason;
  if (reason && BOODSCHAPPEN[reason]) return BOODSCHAPPEN[reason];
  if (err?.status === 413) return BOODSCHAPPEN['te-groot'];
  return ALGEMENE_FOUT;
}

/**
 * Afbeeldingskiezer voor een wens (sc-3028), als popup boven de wens-popup.
 * Vervangt de Cloudinary-uploadwidget.
 *
 * - Zoeken: zoekterm = titel van de wens (was sc-1330), resultaten via Brave Search,
 *   klik = de backend haalt de afbeelding op en laadt ze op.
 * - Foto / bestand: camera (gsm) of bestand, in de browser verkleind, via de backend opgeladen.
 *
 * Geslaagd: de popup sluit met de nieuwe afbeelding (en een voorvertoning) als resultaat. Sluit de popup op een
 * andere manier, dan worden zoeken en opladen afgebroken (was sc-1391).
 */
@Component({
  selector: 'gimmi-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.css']
})
export class ImagePickerComponent implements OnInit, OnDestroy {
  /** Naam waaronder de afbeelding opgeladen wordt. */
  @Input() publicId: string;
  @Input() searchTerm: string = "";

  tab: KiezerTab = 'zoeken';
  zoekterm = '';
  resultaten: IImageSearchResult[] = null;   // null = nog niet gezocht
  zoeken = false;
  zoekFout: string = null;
  bezigMet: string = null;                    // url van het gekozen resultaat, of 'bestand'
  uploadFout: string = null;
  mislukt = new Set<string>();
  toonCamera = false;

  private zoekSub: Subscription;
  private uploadSub: Subscription;
  private vernietigd = false;

  constructor(
    public activeModal: NgbActiveModal,
    private cloudinaryService: CloudinaryService,
    private imageSearchService: ImageSearchService,
    private deviceService: DeviceDetectorService) { }

  ngOnInit(): void {
    this.toonCamera = this.deviceService.isMobile() || this.deviceService.isTablet();
    this.zoekterm = (this.searchTerm || '').trim();
    if (this.zoekterm) this.zoek();
  }

  annuleer(): void {
    this.activeModal.dismiss('Cancel');
  }

  kiesTab(): void {
    this.uploadFout = null;
  }

  zoek(): void {
    const q = (this.zoekterm || '').trim();
    if (!q) return;
    this.zoekSub?.unsubscribe();
    this.zoeken = true;
    this.zoekFout = null;
    this.uploadFout = null;
    this.mislukt.clear();
    this.zoekSub = this.imageSearchService.search(q).subscribe({
      next: resultaten => {
        this.resultaten = resultaten;
        this.zoeken = false;
      },
      error: (err: HttpErrorResponse) => {
        this.resultaten = null;
        this.zoeken = false;
        this.zoekFout = boodschapVoor(err);
      }
    });
  }

  /** Enter in het zoekveld zoekt, en mag niets anders indienen. */
  zoekMetEnter(event: Event): void {
    event.preventDefault();
    this.zoek();
  }

  /** Een thumbnail die niet laadt, zou alleen zijn alt-tekst tonen: weg uit het raster. */
  verwijderResultaat(resultaat: IImageSearchResult): void {
    this.resultaten = this.resultaten.filter(r => r !== resultaat);
  }

  kies(resultaat: IImageSearchResult): void {
    if (this.bezigMet || this.mislukt.has(resultaat.url)) return;
    this.laadOp(resultaat.url, resultaat.url, resultaat.thumbnail);
  }

  async bestandGekozen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const bestand = input.files && input.files[0];
    input.value = '';   // zelfde bestand nog eens kiezen moet opnieuw een change geven
    if (!bestand || this.bezigMet) return;

    this.uploadFout = null;
    if (!bestand.type.startsWith('image/')) {
      this.uploadFout = BOODSCHAPPEN['ongeldige-afbeelding'];
      return;
    }
    if (bestand.size > MAX_BESTAND_BYTES) {
      this.uploadFout = 'Dit bestand is te groot (meer dan 30 MB).';
      return;
    }

    this.bezigMet = BESTAND;
    let dataUri: string;
    try {
      dataUri = await verkleinAfbeelding(bestand);
    } catch (e) {
      this.bezigMet = null;
      this.uploadFout = 'Deze afbeelding kunnen we niet lezen. Kies een andere (jpg, png, webp of gif).';
      return;
    }
    // Popup gesloten tijdens het verkleinen: niets meer doen.
    if (this.vernietigd) return;
    this.laadOp(dataUri, BESTAND, dataUri);
  }

  private laadOp(image: string, sleutel: string, voorvertoning: string): void {
    this.bezigMet = sleutel;
    this.uploadFout = null;
    this.uploadSub = this.cloudinaryService.uploadImage(image, this.publicId).subscribe({
      next: (nieuweAfbeelding: IWishImage) => {
        this.bezigMet = null;
        this.activeModal.close({ afbeelding: nieuweAfbeelding, voorvertoning } as IGekozenAfbeelding);
      },
      error: (err: HttpErrorResponse) => {
        this.bezigMet = null;
        this.uploadFout = boodschapVoor(err);
        if (sleutel !== BESTAND) this.mislukt.add(sleutel);
      }
    });
  }

  ngOnDestroy(): void {
    this.vernietigd = true;
    this.zoekSub?.unsubscribe();
    this.uploadSub?.unsubscribe();   // breekt de HTTP-request af
  }
}
