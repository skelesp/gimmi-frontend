import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IWishImage } from 'src/app/wishes/models/wish.model';
import { environment } from 'src/environments/environment';

/** Standaardafbeelding van een wens zonder eigen beeld; vroeger wish_images/default op Cloudinary. */
export const STANDAARD_AFBEELDING = 'assets/standaard-wens.jpg';

/** Breedtes voor de srcset; de browser kiest er zelf één op basis van `sizes`. */
export const BREEDTES = [160, 320, 480, 640, 960];

/**
 * Afbeeldingen van wensen (sc-2911). Opslaan gebeurt in Cloudflare R2, via de backend
 * (sc-3052): de wens bewaart enkel de sleutel, de backend ruimt oude beelden zelf op.
 * Cloudinary is weg sinds sc-3070.
 */
@Injectable({
  providedIn: 'root'
})
export class ImageService {
  constructor(private http$: HttpClient) { }

  /**
   * Laadt een afbeelding op naar R2. `image` is een http(s)-URL (de backend haalt ze op)
   * of een data-URI van een verkleinde foto. Geeft {key, url} terug.
   */
  public uploadImage(image: string): Observable<IWishImage> {
    return image ? this.http$.post<IWishImage>(environment.apiUrl + 'images', { image }) : of(null);
  }

  /** Heeft de wens een eigen beeld? */
  public heeftBeeld(image: IWishImage): boolean {
    return !!(image?.key && image?.url);
  }

  /** URL van het beeld in de gevraagde breedte, als webp/avif waar de browser dat kan. */
  public src(image: IWishImage, breedte: number): string {
    if (!this.heeftBeeld(image)) return STANDAARD_AFBEELDING;
    // Cloudflare Image Transformations op het eigen beelddomein (img.gimmi.be / img-test.gimmi.be).
    const basis = image.url.slice(0, image.url.length - image.key.length);
    return `${basis}cdn-cgi/image/width=${breedte},fit=scale-down,format=auto/${image.key}`;
  }

  /** srcset met alle BREEDTES, of null voor de standaardafbeelding (één vast bestand). */
  public srcset(image: IWishImage): string {
    if (!this.heeftBeeld(image)) return null;
    return BREEDTES.map(b => `${this.src(image, b)} ${b}w`).join(', ');
  }
}
