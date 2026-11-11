import { ApiProblem } from './api-problem';
import { fieldMessage } from './error-messages';

/**
 * Translates the `errors[]` of a `validation` problem into messages per form field. The key is the JSON
 * Pointer without the leading slash and with dots for nesting (`/birthday/month` becomes `birthday.month`);
 * parameters keep their location (`query.limit`). Several errors on one field give several messages.
 */
export function fieldErrors(problem: ApiProblem): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const error of problem.errors) {
    const field = error.pointer.replace(/^\//, '').replaceAll('/', '.');
    (result[field] ??= []).push(fieldMessage(error));
  }
  return result;
}
