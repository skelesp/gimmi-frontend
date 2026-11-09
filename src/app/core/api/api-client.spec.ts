import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiClient, buildUrl } from './api-client';
import { ApiProblem } from './api-problem';
import { OperationResponse, Schema } from './api-types';
import { problemInterceptor } from './problem-interceptor';

describe('ApiClient', () => {
  let api: ApiClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptors([problemInterceptor])),
        provideHttpClientTesting()
      ]
    });
    api = TestBed.inject(ApiClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('GET /me: typed response', async () => {
    const result = firstValueFrom(api.get('/me'));
    const req = backend.expectOne(environment.apiV2Url + 'me');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'p1', email: 'ria@gimmi.be', firstName: 'Ria', lastName: 'Peeters' });

    // The response is the contract's Account: the types come from schema.ts.
    const account: Schema<'Account'> = await result;
    const sameType: OperationResponse<'getMe'> = account;
    expect(sameType.id).toBe('p1');
  });

  it('fills path parameters and escapes them', () => {
    api.get('/wishes/{wishId}', { path: { wishId: 'a/b' } }).subscribe();
    backend.expectOne(environment.apiV2Url + 'wishes/a%2Fb').flush({});
  });

  it('sends query parameters, skipping empty ones and comma-joining lists', () => {
    api.get('/people/{personId}/wishes', {
      path: { personId: 'p1' },
      query: { status: ['open', 'reserved'], limit: 10, cursor: undefined }
    }).subscribe();
    const req = backend.expectOne(r => r.url === environment.apiV2Url + 'people/p1/wishes');
    expect(req.request.params.get('status')).toBe('open,reserved');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush({ items: [], nextCursor: null });
  });

  it('PATCH sends JSON Merge Patch', () => {
    api.patch('/wishes/{wishId}', { path: { wishId: 'w1' }, body: { title: 'New title' } }).subscribe();
    const req = backend.expectOne(environment.apiV2Url + 'wishes/w1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('Content-Type')).toBe('application/merge-patch+json');
    expect(req.request.body).toEqual({ title: 'New title' });
    req.flush({});
  });

  it('POST sends the body, DELETE has no body', () => {
    api.post('/auth/token', { body: { email: 'ria@gimmi.be', password: 'secret123' } }).subscribe();
    const post = backend.expectOne(environment.apiV2Url + 'auth/token');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ email: 'ria@gimmi.be', password: 'secret123' });
    post.flush({});

    api.delete('/wishes/{wishId}', { path: { wishId: 'w1' } }).subscribe();
    const del = backend.expectOne(environment.apiV2Url + 'wishes/w1');
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('delivers an error response as an ApiProblem', async () => {
    const result = firstValueFrom(api.get('/me'));
    backend.expectOne(environment.apiV2Url + 'me').flush(
      { type: 't', title: 'Unauthenticated', status: 401, code: 'unauthenticated', requestId: 'r1' },
      { status: 401, statusText: 'Unauthorized', headers: { 'Content-Type': 'application/problem+json' } }
    );
    await expect(result).rejects.toBeInstanceOf(ApiProblem);
  });

  it('rejects wrong calls at compile time', () => {
    // @ts-expect-error not a path of the contract
    void (() => api.get('/no-such-path'));
    // @ts-expect-error a path parameter is required
    void (() => api.get('/wishes/{wishId}'));
    // @ts-expect-error getMe has no body
    void (() => api.get('/me', { body: {} }));
  });
});

describe('buildUrl', () => {
  it('joins the base url and the path without a double slash', () => {
    expect(buildUrl('/me')).toBe(environment.apiV2Url + 'me');
  });
});
