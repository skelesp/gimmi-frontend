import { Person } from 'src/app/people/models/person.model';
import { Wish, wishStatus } from '../models/wish.model';
import { FilterOnStatePipe } from './filter-on-state.pipe';

describe('FilterOnStatePipe', () => {
  const pipe = new FilterOnStatePipe();
  const ontvanger = new Person('p1', 'Ria', 'Receiver');

  function wish(id: string, status: wishStatus): Wish {
    const w = new Wish(id, id, 1, null, ontvanger, ontvanger, null, null, null, 1);
    w.status = status;
    return w;
  }

  const wensen = [wish('a', 'Open'), wish('b', 'Reserved'), wish('c', 'Received'), wish('d', 'Fulfilled')];

  it('houdt enkel de wensen met een status uit de filter', () => {
    expect(pipe.transform(wensen, ['Open', 'Received']).map(w => w.id)).toEqual(['a', 'c']);
  });

  it('lege filter: geen wensen', () => {
    expect(pipe.transform(wensen, [])).toEqual([]);
  });

  it('zonder filter: alle wensen ongewijzigd', () => {
    expect(pipe.transform(wensen, undefined)).toBe(wensen);
  });

  it('zonder wensen: geeft de invoer terug', () => {
    expect(pipe.transform(undefined, ['Open'])).toBeUndefined();
  });
});
