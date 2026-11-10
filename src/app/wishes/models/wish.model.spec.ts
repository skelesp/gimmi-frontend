import { Person } from 'src/app/people/models/person.model';
import { Wish } from './wish.model';

// Een wens zoals de app hem kent; de banner en de knop volgen uit status en rollen (wish-card.spec.ts).
describe('Wish', () => {
    const receiver = new Person('receiver', 'Ria', 'Receiver');

    describe('url', () => {
        it('wordt bij aanmaak genormaliseerd naar een externe url', () => {
            const w = new Wish('w1', 'Titel', 10, 'www.voorbeeld.be/product', receiver, receiver, null, null, null, 1);
            expect(w.url).toBe('http://www.voorbeeld.be/product');
        });

        it('zonder url blijft de url leeg', () => {
            const w = new Wish('w1', 'Titel', 10, '', receiver, receiver, null, null, null, 1);
            expect(w.url).toBe('');
        });
    });
});

describe('Wish.can', () => {
    const receiver = new Person('receiver', 'Ria', 'Receiver');
    const make = () => new Wish('w1', 'Titel', 10, null, receiver, receiver, null, null, null, 1);
    const viewer = (can: Partial<Record<'update' | 'delete' | 'copy', boolean>>, roles: ('receiver' | 'other')[] = ['other']) => ({
        roles,
        can: { update: false, delete: false, copy: false, reserve: false, unreserve: false, fulfill: false, unfulfill: false, ...can },
        ownCopyId: null as string | null
    });

    it('de rechten van de server beslissen, ook over een vervulde wens', () => {
        const w = make();
        w.viewer = viewer({ copy: true });
        expect([w.can('update'), w.can('delete'), w.can('copy')]).toEqual([false, false, true]);
        w.viewer = viewer({ update: true, delete: true });
        expect([w.can('update'), w.can('delete'), w.can('copy')]).toEqual([true, true, false]);
    });

    it('zonder kijker (een nieuwe wens in een formulier) mag niets', () => {
        const w = make();
        expect([w.can('update'), w.can('delete'), w.can('copy')]).toEqual([false, false, false]);
        expect(w.hasRole('receiver')).toBe(false);
    });

    it('hasRole volgt de rollen van de server', () => {
        const w = make();
        w.viewer = viewer({}, ['receiver']);
        expect([w.hasRole('receiver'), w.hasRole('giver')]).toEqual([true, false]);
    });
});
