import { Person } from 'src/app/people/models/person.model';
import { CurrentUser } from 'src/app/core/auth/auth-store';
import { testUser } from 'src/app/core/auth/auth-store.testing';
import { Wish, WishScenario, wishStatus } from './wish.model';

// Legt het huidige gedrag vast (sc-2979): welk scenario een wens krijgt, afhankelijk van
// de status en de rol van de ingelogde gebruiker. De wish-banner en de acties hangen hiervan af.
describe('Wish', () => {
    const receiver = new Person('receiver', 'Ria', 'Receiver');
    const creator = new Person('creator', 'Carl', 'Creator');
    const reservator = new Person('reservator', 'Rob', 'Reservator');

    function user(id: string): CurrentUser {
        return testUser({ id, lastName: 'Achternaam', firstName: 'Voornaam', fullName: 'Voornaam Achternaam', email: `${id}@gimmi.be` });
    }

    function wish(status: wishStatus, createdBy: Person = receiver, reservedBy?: Person): Wish {
        const w = new Wish('w1', 'Titel', 10, null, receiver, createdBy, null, null, null, 1);
        w.status = status;
        if (reservedBy) {
            w.reservation = { reservedBy, amount: 1, reservationDate: new Date(), reason: null };
        }
        return w;
    }

    function scenarioFor(w: Wish, userId: string): WishScenario {
        w.setUserIsFlags(user(userId));
        return w.scenario;
    }

    describe('setUserIsFlags', () => {
        it('zet receiver, creator en reservator volgens de ids', () => {
            const w = wish('Reserved', creator, reservator);
            w.setUserIsFlags(user('reservator'));
            expect(w.userIsReceiver).toBe(false);
            expect(w.userIsCreator).toBe(false);
            expect(w.userIsReservator).toBe(true);
        });

        it('zonder reservatie is niemand reservator', () => {
            const w = wish('Open');
            w.setUserIsFlags(user('receiver'));
            expect(w.userIsReceiver).toBe(true);
            expect(w.userIsCreator).toBe(true);
            expect(w.userIsReservator).toBe(false);
        });
    });

    describe('scenario', () => {
        it('Open, eigen wens: OPEN_WISH', () => {
            expect(scenarioFor(wish('Open'), 'receiver')).toBe('OPEN_WISH');
        });

        it('Open, bekeken door een ander: OPEN_WISH', () => {
            expect(scenarioFor(wish('Open'), 'iemand')).toBe('OPEN_WISH');
        });

        it('Open, door de gebruiker aangemaakt voor iemand anders: OPEN_WISH_CREATED_BY_USER_FOR_ANOTHER', () => {
            expect(scenarioFor(wish('Open', creator), 'creator')).toBe('OPEN_WISH_CREATED_BY_USER_FOR_ANOTHER');
        });

        it('Reserved door de gebruiker: RESERVED_BY_USER', () => {
            expect(scenarioFor(wish('Reserved', receiver, reservator), 'reservator')).toBe('RESERVED_BY_USER');
        });

        it('Reserved door een ander, bekeken door een derde: RESERVED', () => {
            expect(scenarioFor(wish('Reserved', receiver, reservator), 'iemand')).toBe('RESERVED');
        });

        it('Reserved, bekeken door de ontvanger: RESERVED_INCOGNITO_FOR_USER (ontvanger mag het niet weten)', () => {
            expect(scenarioFor(wish('Reserved', receiver, reservator), 'receiver')).toBe('RESERVED_INCOGNITO_FOR_USER');
        });

        it('Received, gegeven door de gebruiker: RECEIVED_GIVEN_BY_USER', () => {
            expect(scenarioFor(wish('Received', receiver, reservator), 'reservator')).toBe('RECEIVED_GIVEN_BY_USER');
        });

        it('Received, bekeken door de ontvanger: RECEIVED_RECEIVER', () => {
            expect(scenarioFor(wish('Received', receiver, reservator), 'receiver')).toBe('RECEIVED_RECEIVER');
        });

        it('Received, bekeken door een derde: RECEIVED', () => {
            expect(scenarioFor(wish('Received', receiver, reservator), 'iemand')).toBe('RECEIVED');
        });

        it('Fulfilled door de gebruiker: FULFILLED_BY_USER', () => {
            expect(scenarioFor(wish('Fulfilled', receiver, reservator), 'reservator')).toBe('FULFILLED_BY_USER');
        });

        it('Fulfilled, bekeken door iemand anders: FULFILLED', () => {
            expect(scenarioFor(wish('Fulfilled', receiver, reservator), 'receiver')).toBe('FULFILLED');
        });

        it('onbekende status: geen scenario en een waarschuwing', () => {
            vi.spyOn(console, 'warn').mockReturnValue(undefined);
            const w = wish(undefined);
            w.setUserIsFlags(user('receiver'));
            expect(w.scenario).toBeUndefined();
            expect(console.warn).toHaveBeenCalled();
        });
    });

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
