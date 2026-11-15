import { FullNamePipe } from './full-name-pipe';

describe('FullNamePipe', () => {
  const pipe = new FullNamePipe();

  it('joins first and last name', () => {
    expect(pipe.transform({ firstName: 'Ria', lastName: 'Receiver' })).toBe('Ria Receiver');
  });

  it('gives an empty text without a person', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
