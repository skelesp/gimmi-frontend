import { ApiProblem, ProblemCode } from './api-problem';
import { errorMessages, fieldMessage, problemMessage } from './error-messages';
import { fieldErrors } from './form-errors';

function problem(code: string, status: number, errors: ApiProblem['errors'] = []): ApiProblem {
  return new ApiProblem({ code: code as ProblemCode, status, errors, requestId: 'r1' });
}

describe('problemMessage', () => {
  it('has a Dutch message for every code', () => {
    for (const message of Object.values(errorMessages)) {
      expect(message.length).toBeGreaterThan(5);
    }
  });

  it('picks the message on code', () => {
    expect(problemMessage(problem('email-taken', 409))).toBe(errorMessages['email-taken']);
  });

  it('falls back to the status for an unknown code', () => {
    expect(problemMessage(problem('brand-new-code', 409))).toBe(errorMessages.conflict);
    expect(problemMessage(problem('brand-new-code', 503))).toBe(errorMessages.unavailable);
    expect(problemMessage(problem('brand-new-code', 500))).toBe(errorMessages.internal);
    expect(problemMessage(problem('brand-new-code', 418))).toContain('Er ging iets mis');
  });
});

describe('fieldErrors', () => {
  it('maps pointers to field names and collects messages per field', () => {
    const result = fieldErrors(problem('validation', 400, [
      { pointer: '/title', code: 'required' },
      { pointer: '/title', code: 'maxLength' },
      { pointer: '/birthday/month', code: 'maximum' },
      { pointer: '/query/limit', code: 'unheard-of' }
    ]));
    expect(result).toEqual({
      title: [fieldMessage({ pointer: '', code: 'required' }), fieldMessage({ pointer: '', code: 'maxLength' })],
      'birthday.month': ['Deze waarde is te groot.'],
      'query.limit': ['Deze waarde is niet geldig.']
    });
  });

  it('is empty without errors', () => {
    expect(fieldErrors(problem('validation', 400))).toEqual({});
  });
});
