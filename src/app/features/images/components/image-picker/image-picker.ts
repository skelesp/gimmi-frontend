import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { NgbActiveModal, NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLink, NgbNavLinkBase, NgbNavContent, NgbAlert, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { ApiProblem } from 'src/app/core/api/api-problem';
import { problemMessage } from 'src/app/core/api/error-messages';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Subscription } from 'rxjs';
import { WishImage } from 'src/app/features/wishes/wish';
import { ImagesData } from '../../images-data';
import { IImageSearchResult, ImageSearch } from '../../image-search';
import { resizeImage } from '../../utils/resize-image';
import { FormField, form, maxLength } from '@angular/forms/signals';


export type PickerTab = 'search' | 'file';

/**
 * Result of the picker: the uploaded image, and a preview the browser already has
 * (thumbnail of the search result or the resized photo). This way the wish popup
 * can show the new image right away, without waiting until it has been fetched.
 */
export interface ChosenImage {
  image: WishImage;
  preview: string;
}

/** Largest file we still try to resize; a phone photo is rarely larger. */
export const MAX_FILE_BYTES = 30 * 1024 * 1024;

const FILE = 'file';

const INVALID_IMAGE = 'Dit bestand is geen bruikbare afbeelding.';
const GENERIC_ERROR = 'Er ging iets mis. Probeer het opnieuw.';

/** The message for a failed call: the text for the API v2 error code (sc-3290), otherwise a generic one. */
export function messageFor(err: unknown): string {
  return err instanceof ApiProblem ? problemMessage(err) : GENERIC_ERROR;
}

/**
 * Image picker for a wish (sc-3028), as a popup above the wish popup.
 * Replaces the Cloudinary upload widget. Uploading goes to R2, via the backend (sc-3052, sc-2911).
 *
 * - Search: query = title of the wish (was sc-1330), results via Brave Search,
 *   click = the backend fetches the image and uploads it.
 * - Photo / file: camera (phone) or file, resized in the browser, uploaded via the backend.
 *
 * On success the popup closes with the new image (and a preview) as its result. If the popup closes
 * any other way, searching and uploading are aborted (was sc-1391).
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

  tab: PickerTab = 'search';
  protected readonly searchModel = signal({ term: '' });
  protected readonly searchForm = form(this.searchModel, path => maxLength(path.term, 200));
  get query(): string { return this.searchModel().term; }
  set query(term: string) { this.searchModel.set({ term }); }
  readonly results = signal<IImageSearchResult[]>(null);   // null = not searched yet
  readonly searching = signal(false);
  readonly searchError = signal<string>(null);
  readonly busyWith = signal<string>(null);                    // url of the chosen result, or 'file'
  readonly uploadError = signal<string>(null);
  readonly failed = signal(new Set<string>());
  showCamera = false;

  private searchSub: Subscription;
  private uploadSub: Subscription;
  private destroyed = false;

  ngOnInit(): void {
    this.showCamera = this.deviceService.isMobile() || this.deviceService.isTablet();
    this.query = (this.searchTerm || '').trim();
    if (this.query) this.search();
  }

  cancel(): void {
    this.activeModal.dismiss('Cancel');
  }

  onTabChange(): void {
    this.uploadError.set(null);
  }

  search(): void {
    const q = (this.query || '').trim();
    if (!q || this.searchForm().invalid()) return;
    this.searchSub?.unsubscribe();
    this.searching.set(true);
    this.searchError.set(null);
    this.uploadError.set(null);
    this.failed.set(new Set());
    this.searchSub = this.imageSearchService.search(q).subscribe({
      next: results => {
        this.results.set(results);
        this.searching.set(false);
      },
      error: (err: unknown) => {
        this.results.set(null);
        this.searching.set(false);
        this.searchError.set(messageFor(err));
      }
    });
  }

  /** Enter in the search field searches, and must not submit anything else. */
  searchOnEnter(event: Event): void {
    event.preventDefault();
    this.search();
  }

  /** A thumbnail that does not load would only show its alt text: remove it from the grid. */
  removeResult(result: IImageSearchResult): void {
    this.results.set(this.results().filter(r => r !== result));
  }

  choose(result: IImageSearchResult): void {
    if (this.busyWith() || this.failed().has(result.url)) return;
    this.upload(result.url, result.url, result.thumbnailUrl);
  }

  async fileChosen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    input.value = '';   // choosing the same file again must fire a new change
    if (!file || this.busyWith()) return;

    this.uploadError.set(null);
    if (!file.type.startsWith('image/')) {
      this.uploadError.set(INVALID_IMAGE);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.uploadError.set('Dit bestand is te groot (meer dan 30 MB).');
      return;
    }

    this.busyWith.set(FILE);
    let photo: Blob;
    try {
      photo = await resizeImage(file);
    } catch {
      this.busyWith.set(null);
      this.uploadError.set('Deze afbeelding kunnen we niet lezen. Kies een andere (jpg, png, webp of gif).');
      return;
    }
    // Popup closed while resizing: do nothing more.
    if (this.destroyed) return;
    this.upload(photo, FILE, URL.createObjectURL(photo));
  }

  private upload(image: Blob | string, key: string, preview: string): void {
    this.busyWith.set(key);
    this.uploadError.set(null);
    this.uploadSub = this.imageService.uploadImage(image).subscribe({
      next: (newImage: WishImage) => {
        this.busyWith.set(null);
        this.activeModal.close({ image: newImage, preview } as ChosenImage);
      },
      error: (err: unknown) => {
        this.busyWith.set(null);
        this.uploadError.set(messageFor(err));
        if (key !== FILE) this.failed.update(set => new Set(set).add(key));
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.searchSub?.unsubscribe();
    this.uploadSub?.unsubscribe();   // aborts the HTTP request
  }
}
