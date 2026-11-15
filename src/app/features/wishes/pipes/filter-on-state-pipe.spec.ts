import { apiWish } from '../wish.testing';
import { WishStatus } from '../wish';
import { FilterOnStatePipe } from './filter-on-state-pipe';

describe('FilterOnStatePipe', () => {
  const pipe = new FilterOnStatePipe();

  const wish = (id: string, status: WishStatus) => apiWish({ id, title: id, status });
  const wensen = [wish('a', 'open'), wish('b', 'reserved'), wish('c', 'received'), wish('d', 'fulfilled')];

  it('houdt enkel de wensen met een status uit de filter', () => {
    expect(pipe.transform(wensen, ['open', 'received']).map(w => w.id)).toEqual(['a', 'c']);
  });

  it('lege filter: geen wensen', () => {
    expect(pipe.transform(wensen, [])).toEqual([]);
  });

  it('zonder filter: alle wensen ongewijzigd', () => {
    expect(pipe.transform(wensen, undefined)).toBe(wensen);
  });

  it('zonder wensen: geeft de invoer terug', () => {
    expect(pipe.transform(undefined, ['open'])).toBeUndefined();
  });
});
