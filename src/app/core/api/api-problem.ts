import { HttpErrorResponse } from '@angular/common/http';
import type { components } from './schema';

export type ProblemCode = components['schemas']['ProblemCode'];
export type ProblemFieldError = components['schemas']['ProblemFieldError'];
type ProblemBody = components['schemas']['Problem'];

/**
 * An error response of API v2 (`application/problem+json`, RFC 9457). `title` and `detail` are English
 * and for developers; what the user sees is picked on `code` (see error-messages.ts).
 */
export class ApiProblem extends Error {
  readonly code: ProblemCode;
  readonly status: number;
  readonly errors: ProblemFieldError[];
  readonly requestId?: string;
  readonly detail?: string;
  /** Seconds to wait before retrying, from `Retry-After` (429, 503). */
  readonly retryAfter?: number;

  constructor(body: Partial<ProblemBody>, retryAfter?: number) {
    super(body.title ?? 'API problem');
    this.name = 'ApiProblem';
    this.code = body.code;
    this.status = body.status;
    this.errors = body.errors ?? [];
    this.requestId = body.requestId;
    this.detail = body.detail ?? undefined;
    this.retryAfter = retryAfter;
  }

  /** The server failed (5xx): worth reporting with its `requestId`. */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Converts a failed response into an `ApiProblem`, or returns `undefined` when the response is not a
   * problem document (v1 errors, network failures).
   */
  static from(response: HttpErrorResponse): ApiProblem | undefined {
    const isProblem = response.headers?.get('Content-Type')?.includes('application/problem+json');
    const body = response.error;
    if (!isProblem || !body || typeof body !== 'object') {
      return undefined;
    }
    const retryAfter = Number(response.headers.get('Retry-After'));
    return new ApiProblem(
      { ...body, status: body.status ?? response.status },
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined
    );
  }
}
