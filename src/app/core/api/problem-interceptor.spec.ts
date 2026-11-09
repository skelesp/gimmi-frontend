import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ApiProblem } from './api-problem';
import { problemInterceptor } from './problem-interceptor';

describe('problemInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  function fail(body: unknown, init: { status: number; headers?: Record<string, string> }): unknown {
    let error: unknown;
    http.get('/x').subscribe({ error: e => error = e });
    backend.expectOne('/x').flush(body, { statusText: 'Error', ...init });
    return error;
  }

  const problemHeaders = { 'Content-Type': 'application/problem+json' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptors([problemInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('turns application/problem+json into an ApiProblem', () => {
    const error = fail(
      { type: 'https://gimmi.be/problems/conflict', title: 'Conflict', status: 409, code: 'wish-already-reserved', requestId: 'r1' },
      { status: 409, headers: problemHeaders }
    ) as ApiProblem;
    expect(error).toBeInstanceOf(ApiProblem);
    expect(error.code).toBe('wish-already-reserved');
    expect(error.status).toBe(409);
    expect(error.requestId).toBe('r1');
    expect(error.errors).toEqual([]);
    expect(error.isServerError).toBe(false);
  });

  it('keeps errors[] of a validation problem', () => {
    const errors = [{ pointer: '/title', code: 'required' }];
    const error = fail(
      { type: 't', title: 'Invalid request', status: 400, code: 'validation', requestId: 'r2', errors },
      { status: 400, headers: problemHeaders }
    ) as ApiProblem;
    expect(error.errors).toEqual(errors);
  });

  it('reads Retry-After on 429', () => {
    const error = fail(
      { type: 't', title: 'Too many requests', status: 429, code: 'rate-limited', requestId: 'r3' },
      { status: 429, headers: { ...problemHeaders, 'Retry-After': '12' } }
    ) as ApiProblem;
    expect(error.retryAfter).toBe(12);
  });

  it('marks 5xx as a server error', () => {
    const error = fail(
      { type: 't', title: 'Internal', status: 503, code: 'unavailable', requestId: 'r4' },
      { status: 503, headers: problemHeaders }
    ) as ApiProblem;
    expect(error.isServerError).toBe(true);
    expect(error.retryAfter).toBeUndefined();
  });

  it('passes other errors (v1, no problem document) on unchanged', () => {
    const error = fail({ message: 'x' }, { status: 500 });
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(500);
  });

  it('passes a problem content type without a body on unchanged', () => {
    const error = fail(null, { status: 502, headers: problemHeaders });
    expect(error).toBeInstanceOf(HttpErrorResponse);
  });
});
