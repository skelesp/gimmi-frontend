import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { IImageSearchResult, ImageSearchService } from './image-search.service';

// Afbeeldingen zoeken via API v2 (Brave Search, sc-3028, sc-3290).
describe('ImageSearchService', () => {
  let service: ImageSearchService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
    service = TestBed.inject(ImageSearchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('vraagt GET /image-search-results met de zoekterm als q (gecodeerd) en geeft de items terug', () => {
    const resultaat: IImageSearchResult = {
      url: 'https://winkel.be/fiets.jpg', thumbnailUrl: 'https://imgs.search.brave.com/x',
      width: 800, height: 600, title: 'Fiets', source: 'winkel.be', pageUrl: 'https://winkel.be/fiets'
    };
    let ontvangen: IImageSearchResult[];
    service.search('rode fiets & bel').subscribe(r => ontvangen = r);

    const req = http.expectOne(r => r.url === environment.apiV2Url + 'image-search-results');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('rode fiets & bel');
    expect(req.request.urlWithParams).toContain('q=rode%20fiets%20%26%20bel');
    req.flush({ items: [resultaat], nextCursor: null });
    expect(ontvangen).toEqual([resultaat]);
  });
});
