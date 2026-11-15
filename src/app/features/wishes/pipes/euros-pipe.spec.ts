import { EurosPipe } from './euros-pipe';

describe('EurosPipe', () => {
  const pipe = new EurosPipe();

  it('turns cents into euros', () => {
    expect(pipe.transform({ amount: 1250, currency: 'EUR' })).toBe(12.5);
  });

  it('gives null without a price', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
  });
});
