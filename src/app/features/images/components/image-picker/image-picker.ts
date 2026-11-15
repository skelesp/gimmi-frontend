import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { NgbActiveModal, NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLink, NgbNavLinkBase, NgbNavContent, NgbAlert, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { ApiProblem } from 'src/app/core/api/api-problem';
import { problemMessage } from 'src/app/core/api/error-messages';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Subscription } from 'rxjs';
import { IWishImage } from 'src/app/features/wishes/models/wish.model';
import { ImagesData } from '../../images-data';
import { IImageSearchResult, ImageSearch } from '../../image-search';
import { verkleinAfbeelding } from '../../utils/resize-image';
import { FormField, form, maxLength } from '@angular/forms/signals';


export type KiezerTab = 'zoeken' | 'bestand';

/**
 * Resultaat van de kiezer: de opgeladen afbeelding, en een voorvertoning die de browser
 * al heeft (thumbnail van het zoekresultaat of de verkleinde foto). Zo kan de wens-popup
 * de nieuwe afbeelding meteen tonen, zonder te wachten tot ze opgehaald is.
 */
export interface IGekozenAfbeelding {
  afbeelding: IWishImage;
  voorvertoning: string;
}

/** Grootste bestand dat we nog proberen te verkleinen; een foto van een gsm is zelden groter. */
export const MAX_BESTAND_BYTES = 30 * 1024 * 1024;

const BESTAND = 'bestand';

const ONGELDIGE_AFBEELDING = 'Dit bestand is geen bruikbare afbeelding.';
const ALGEMENE_FOUT = 'Er ging iets mis. Probeer het opnieuw.';

/** De melding voor een mislukte oproep: de tekst bij de foutcode van API v2 (sc-3290), anders een algemene. */
export function boodschapVoor(err: unknown): string {
  return err instanceof ApiProblem ? problemMessage(err) : ALGEMENE_FOUT;
}

/**
 * Afbeeldingskiezer voor een wens (sc-3028), als popup boven de wens-popup.
 * Vervangt de Cloudinary-uploadwidget. Opladen gaat naar R2, via de backend (sc-3052, sc-2911).
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
    templateUrl: './image-picker.html',
    styleUrls: ['./image-picker.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLink, NgbNavLinkBase, NgbNavContent, FormField, NgbAlert, NgbNavOutlet]
})
export class ImagePicker implements OnInit, OnDestroy {
  activeModal = inject(NgbActiveModal);
  private imageService = inject(ImagesData);
  private imageSearchService = inject(ImageSearch);
  private deviceService = inject(DeviceDetectorService);

  @Input() searchTerm = "";

  tab: KiezerTab = 'zoeken';
  protected readonly zoekModel = signal({ term: '' });
  protected readonly zoekForm = form(this.zoekModel, path => maxLength(path.term, 200));
  get zoekterm(): string { return this.zoekModel().term; }
  set zoekterm(term: string) { this.zoekModel.set({ term }); }
  readonly resultaten = signal<IImageSearchResult[]>(null);   // null = nog niet gezocht
  readonly zoeken = signal(false);
  readonly zoekFout = signal<string>(null);
  readonly bezigMet = signal<string>(null);                    // url van het gekozen resultaat, of 'bestand'
  readonly uploadFout = signal<string>(null);
  readonly mislukt = signal(new Set<string>());
  toonCamera = false;

  private zoekSub: Subscription;
  private uploadSub: Subscription;
  private vernietigd = false;

  ngOnInit(): void {
    this.toonCamera = this.deviceService.isMobile() || this.deviceService.isTablet();
    this.zoekterm = (this.searchTerm || '').trim();
    if (this.zoekterm) this.zoek();
  }

  annuleer(): void {
    this.activeModal.dismiss('Cancel');
  }

  kiesTab(): void {
    this.uploadFout.set(null);
  }

  zoek(): void {
    const q = (this.zoekterm || '').trim();
    if (!q || this.zoekForm().invalid()) return;
    this.zoekSub?.unsubscribe();
    this.zoeken.set(true);
    this.zoekFout.set(null);
    this.uploadFout.set(null);
    this.mislukt.set(new Set());
    this.zoekSub = this.imageSearchService.search(q).subscribe({
      next: resultaten => {
        this.resultaten.set(resultaten);
        this.zoeken.set(false);
      },
      error: (err: unknown) => {
        this.resultaten.set(null);
        this.zoeken.set(false);
        this.zoekFout.set(boodschapVoor(err));
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
    this.resultaten.set(this.resultaten().filter(r => r !== resultaat));
  }

  kies(resultaat: IImageSearchResult): void {
    if (this.bezigMet() || this.mislukt().has(resultaat.url)) return;
    this.laadOp(resultaat.url, resultaat.url, resultaat.thumbnailUrl);
  }

  async bestandGekozen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const bestand = input.files && input.files[0];
    input.value = '';   // zelfde bestand nog eens kiezen moet opnieuw een change geven
    if (!bestand || this.bezigMet()) return;

    this.uploadFout.set(null);
    if (!bestand.type.startsWith('image/')) {
      this.uploadFout.set(ONGELDIGE_AFBEELDING);
      return;
    }
    if (bestand.size > MAX_BESTAND_BYTES) {
      this.uploadFout.set('Dit bestand is te groot (meer dan 30 MB).');
      return;
    }

    this.bezigMet.set(BESTAND);
    let foto: Blob;
    try {
      foto = await verkleinAfbeelding(bestand);
    } catch (e) {
      this.bezigMet.set(null);
      this.uploadFout.set('Deze afbeelding kunnen we niet lezen. Kies een andere (jpg, png, webp of gif).');
      return;
    }
    // Popup gesloten tijdens het verkleinen: niets meer doen.
    if (this.vernietigd) return;
    this.laadOp(foto, BESTAND, URL.createObjectURL(foto));
  }

  private laadOp(image: Blob | string, sleutel: string, voorvertoning: string): void {
    this.bezigMet.set(sleutel);
    this.uploadFout.set(null);
    this.uploadSub = this.imageService.uploadImage(image).subscribe({
      next: (nieuweAfbeelding: IWishImage) => {
        this.bezigMet.set(null);
        this.activeModal.close({ afbeelding: nieuweAfbeelding, voorvertoning } as IGekozenAfbeelding);
      },
      error: (err: unknown) => {
        this.bezigMet.set(null);
        this.uploadFout.set(boodschapVoor(err));
        if (sleutel !== BESTAND) this.mislukt.update(set => new Set(set).add(sleutel));
      }
    });
  }

  ngOnDestroy(): void {
    this.vernietigd = true;
    this.zoekSub?.unsubscribe();
    this.uploadSub?.unsubscribe();   // breekt de HTTP-request af
  }
}
