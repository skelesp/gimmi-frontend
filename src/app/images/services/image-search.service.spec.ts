import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { IImageSearchResult, ImageSearchService } from './image-search.service';

// Afbeeldingen zoeken via de backend (Brave Search, sc-3028).
describe('ImageSearchService', () => {
  let service: ImageSearchService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ImageSearchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('vraagt GET images/search met de zoekterm als q (gecodeerd) en geeft de resultaten terug', () => {
    const resultaat: IImageSearchResult = {
      url: 'https://winkel.be/fiets.jpg', thumbnail: 'https://imgs.search.brave.com/x',
      width: 800, height: 600, title: 'Fiets', source: 'winkel.be', page: 'https://winkel.be/fiets'
    };
    let ontvangen: IImageSearchResult[];
    service.search('rode fiets & bel').subscribe(r => ontvangen = r);

    const req = http.expectOne(r => r.url === environment.apiUrl + 'images/search');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('rode fiets & bel');
    expect(req.request.urlWithParams).toContain('q=rode%20fiets%20%26%20bel');
    req.flush({ query: 'rode fiets & bel', cached: false, results: [resultaat] });
    expect(ontvangen).toEqual([resultaat]);
  });

  it('zonder results in het antwoord: een lege lijst', () => {
    let ontvangen: IImageSearchResult[];
    service.search('x').subscribe(r => ontvangen = r);
    http.expectOne(r => r.url === environment.apiUrl + 'images/search').flush({});
    expect(ontvangen).toEqual([]);
  });
});
