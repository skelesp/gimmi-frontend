import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from 'src/app/core/api/api-client';
import type { Schema } from 'src/app/core/api/api-types';

/** One search result from API v2 (GET /image-search-results, sc-3290). */
export type IImageSearchResult = Schema<'ImageSearchResult'>;

/**
 * Searching images via the backend, which calls Brave Search (sc-3028).
 * Replaces the Google search in the Cloudinary widget (that API stops on 1-1-2027).
 */
@Service()
export class ImageSearch {
  private api = inject(ApiClient);

  public search(query: string): Observable<IImageSearchResult[]> {
    return this.api.get('/image-search-results', { query: { q: query } }).pipe(
      map(page => page.items)
    );
  }
}
