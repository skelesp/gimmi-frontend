import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

/** Eén zoekresultaat zoals de backend het teruggeeft (GET /api/images/search, sc-3028). */
export interface IImageSearchResult {
  url: string;          // de afbeelding zelf: die geef je aan CloudinaryService.uploadImage
  thumbnail: string;    // kleine versie via de proxy van Brave
  width: number | null;
  height: number | null;
  title: string;
  source: string;
  page: string | null;
}

/**
 * Afbeeldingen zoeken via de backend, die Brave Search aanroept.
 * Vervangt het zoeken met Google in de Cloudinary-widget (die API stopt op 1-1-2027).
 */
@Injectable({
  providedIn: 'root'
})
export class ImageSearchService {

  constructor(private http$: HttpClient) { }

  public search(query: string): Observable<IImageSearchResult[]> {
    return this.http$.get<{ results: IImageSearchResult[] }>(
      environment.apiUrl + 'images/search',
      { params: new HttpParams().set('q', query) }
    ).pipe(
      map(antwoord => antwoord.results || [])
    );
  }
}
