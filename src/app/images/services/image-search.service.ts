import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from 'src/app/core/api/api-client';
import type { Schema } from 'src/app/core/api/api-types';

/** Eén zoekresultaat van API v2 (GET /image-search-results, sc-3290). */
export type IImageSearchResult = Schema<'ImageSearchResult'>;

/**
 * Afbeeldingen zoeken via de backend, die Brave Search aanroept (sc-3028).
 * Vervangt het zoeken met Google in de Cloudinary-widget (die API stopt op 1-1-2027).
 */
@Injectable({
  providedIn: 'root'
})
export class ImageSearchService {
  private api = inject(ApiClient);

  public search(query: string): Observable<IImageSearchResult[]> {
    return this.api.get('/image-search-results', { query: { q: query } }).pipe(
      map(page => page.items)
    );
  }
}
