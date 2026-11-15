import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { IImageSearchResult, ImageSearch } from './image-search';

// Searching images via API v2 (Brave Search, sc-3028, sc-3290).
describe('ImageSearch', () => {
  let service: ImageSearch;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
    service = TestBed.inject(ImageSearch);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests GET /image-search-results with the query as q (encoded) and returns the items', () => {
    const result: IImageSearchResult = {
      url: 'https://shop.be/bike.jpg', thumbnailUrl: 'https://imgs.search.brave.com/x',
      width: 800, height: 600, title: 'Bike', source: 'shop.be', pageUrl: 'https://shop.be/bike'
    };
    let received: IImageSearchResult[];
    service.search('red bike & bell').subscribe(r => received = r);

    const req = http.expectOne(r => r.url === environment.apiV2Url + 'image-search-results');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('red bike & bell');
    expect(req.request.urlWithParams).toContain('q=red%20bike%20%26%20bell');
    req.flush({ items: [result], nextCursor: null });
    expect(received).toEqual([result]);
  });
});
