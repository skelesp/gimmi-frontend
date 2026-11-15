import { ApiProblem } from './api-problem';

describe('ApiProblem.of', () => {
  const problem = new ApiProblem({ status: 404, code: 'not-found' });

  it('gives the problem itself', () => {
    expect(ApiProblem.of(problem)).toBe(problem);
  });

  it('finds the problem behind the error a resource wraps', () => {
    expect(ApiProblem.of(Object.assign(new Error('Resource is in an error state'), { cause: problem }))).toBe(problem);
  });

  it('gives undefined for any other error', () => {
    expect(ApiProblem.of(new Error('offline'))).toBeUndefined();
    expect(ApiProblem.of(undefined)).toBeUndefined();
    expect(ApiProblem.of(null)).toBeUndefined();
  });
});
