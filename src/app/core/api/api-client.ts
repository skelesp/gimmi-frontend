import { HttpClient, HttpParams } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiPath, ArgsOf, HttpMethod, ResponseOf } from './api-types';

// Loose on purpose: the public methods are the typed surface, and they pass on what the contract allows.
interface Options { path?: unknown; query?: unknown; body?: unknown }

/**
 * The one typed layer over HttpClient for API v2. Paths, parameters, bodies and responses come from the
 * contract (schema.ts), so a wrong path or body is a compile error:
 *
 *   api.get('/me')                                    // Observable<Account>
 *   api.get('/wishes/{wishId}', { path: { wishId } })
 *   api.patch('/wishes/{wishId}', { path: { wishId }, body: { title: 'New' } })
 *
 * Errors arrive as ApiProblem (problemInterceptor). ETag/If-Match and 429/Retry-After need no logic here.
 */
@Service()
export class ApiClient {
  private http = inject(HttpClient);

  get<P extends ApiPath<'get'>>(path: P, ...args: ArgsOf<P, 'get'>): Observable<ResponseOf<P, 'get'>> {
    return this.request('get', path, args[0]);
  }

  post<P extends ApiPath<'post'>>(path: P, ...args: ArgsOf<P, 'post'>): Observable<ResponseOf<P, 'post'>> {
    return this.request('post', path, args[0]);
  }

  put<P extends ApiPath<'put'>>(path: P, ...args: ArgsOf<P, 'put'>): Observable<ResponseOf<P, 'put'>> {
    return this.request('put', path, args[0]);
  }

  /** Partial update as JSON Merge Patch (RFC 7396): `null` removes a field, an absent field stays. */
  patch<P extends ApiPath<'patch'>>(path: P, ...args: ArgsOf<P, 'patch'>): Observable<ResponseOf<P, 'patch'>> {
    return this.request('patch', path, args[0]);
  }

  delete<P extends ApiPath<'delete'>>(path: P, ...args: ArgsOf<P, 'delete'>): Observable<ResponseOf<P, 'delete'>> {
    return this.request('delete', path, args[0]);
  }

  private request<T>(method: HttpMethod, path: string, options: Options = {}): Observable<T> {
    return this.http.request<T>(method, buildUrl(path, options.path as Record<string, string>), {
      body: options.body,
      params: buildParams(options.query as Record<string, unknown>),
      headers: method === 'patch' ? { 'Content-Type': 'application/merge-patch+json' } : undefined
    });
  }
}

/** `/wishes/{wishId}` and `{ wishId: 'a/b' }` become `<apiV2Url>wishes/a%2Fb`. */
export function buildUrl(path: string, pathParams: Record<string, string> = {}): string {
  const filled = path.replace(/\{(\w+)\}/g, (_, name) => encodeURIComponent(pathParams[name]));
  return environment.apiV2Url + filled.replace(/^\//, '');
}

function buildParams(query: Record<string, unknown> = {}): HttpParams {
  let params = new HttpParams();
  for (const [name, value] of Object.entries(query)) {
    // Lists are comma-separated (`?status=open,reserved`), as the contract defines them.
    if (value !== undefined && value !== null) {
      params = params.append(name, Array.isArray(value) ? value.join(',') : String(value));
    }
  }
  return params;
}
