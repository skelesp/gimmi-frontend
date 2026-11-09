import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiProblem } from './api-problem';

// Turns `application/problem+json` into an ApiProblem and rethrows it. Shows nothing: the component or
// domain service decides (field errors in place, the rest as a toast via ProblemNotifier). Other errors
// (v1, network failures) pass unchanged.
export const problemInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError(error => {
      const problem = error instanceof HttpErrorResponse ? ApiProblem.from(error) : undefined;
      return throwError(() => problem ?? error);
    })
  );
