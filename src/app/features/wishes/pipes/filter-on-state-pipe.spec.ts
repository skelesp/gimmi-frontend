import { apiWish } from '../wish.testing';
import { WishStatus } from '../wish';
import { FilterOnStatePipe } from './filter-on-state-pipe';

describe('FilterOnStatePipe', () => {
  const pipe = new FilterOnStatePipe();

  const wish = (id: string, status: WishStatus) => apiWish({ id, title: id, status });
  const wishes = [wish('a', 'open'), wish('b', 'reserved'), wish('c', 'received'), wish('d', 'fulfilled')];

  it('keeps only the wishes with a status from the filter', () => {
    expect(pipe.transform(wishes, ['open', 'received']).map(w => w.id)).toEqual(['a', 'c']);
  });

  it('empty filter: no wishes', () => {
    expect(pipe.transform(wishes, [])).toEqual([]);
  });

  it('without filter: all wishes unchanged', () => {
    expect(pipe.transform(wishes, undefined)).toBe(wishes);
  });

  it('without wishes: returns the input', () => {
    expect(pipe.transform(undefined, ['open'])).toBeUndefined();
  });
});
