import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiProblem } from '../../../../core/api/api-problem';
import { ProblemNotifier } from '../../../../core/api/problem-notifier';
import { People, PersonPreference, PersonProfile } from '../../service/people';
import { ExtraInfo } from './extra-info';

// Extra info over een persoon: wat je graag en liever niet krijgt. Leesmodus (sc-1989) en
// bewerkmodus (sc-2375), enkel voor de persoon zelf (`viewer.can.update`).
describe('ExtraInfo', () => {
    let fixture: ComponentFixture<ExtraInfo>;
    let people: { updatePreferences: ReturnType<typeof vi.fn> };
    let problems: { show: ReturnType<typeof vi.fn> };
    const boeken: PersonPreference = { text: 'Boeken', url: null };
    const thee: PersonPreference = { text: 'Thee', url: 'https://thee.be' };
    const sokken: PersonPreference = { text: 'Sokken', url: null };

    async function toon(opties: { likes?: PersonPreference[]; dislikes?: PersonPreference[]; canEdit: boolean }) {
        fixture = TestBed.createComponent(ExtraInfo);
        fixture.componentRef.setInput('personId', 'ria');
        fixture.componentRef.setInput('firstName', 'Ria');
        fixture.componentRef.setInput('likes', opties.likes ?? []);
        fixture.componentRef.setInput('dislikes', opties.dislikes ?? []);
        fixture.componentRef.setInput('canEdit', opties.canEdit);
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }

    function potlood(): HTMLElement {
        // The hidden container of the pencil button.
        return el().querySelector<HTMLElement>('button[aria-label="Extra info aanpassen"]').parentElement;
    }

    async function bewerk() {
        el().querySelector<HTMLElement>('button[aria-label="Extra info aanpassen"]').click();
        await fixture.whenStable();
    }

    function rijen(type: 'likes' | 'dislikes'): HTMLInputElement[][] {
        const edit = el().querySelectorAll('gimmi-extra-info-edit')[type === 'likes' ? 0 : 1];
        return Array.from(edit.querySelectorAll('.row')).map(r => Array.from(r.querySelectorAll('input')) as HTMLInputElement[]);
    }

    async function typ(input: HTMLInputElement, waarde: string) {
        input.value = waarde;
        input.dispatchEvent(new Event('input'));
        await fixture.whenStable();
    }

    function bewaarKnop(): HTMLButtonElement { return el().querySelector('button[type="submit"]'); }

    beforeEach(async () => {
        people = { updatePreferences: vi.fn().mockName('People.updatePreferences') };
        problems = { show: vi.fn().mockName('ProblemNotifier.show') };
        await TestBed.configureTestingModule({
            imports: [ExtraInfo],
            providers: [
                { provide: People, useValue: people },
                { provide: ProblemNotifier, useValue: problems }
            ]
        }).compileComponents();
    });

    describe('leesmodus (sc-1989)', () => {
        it('toont wat de persoon graag en liever niet krijgt, met een link waar er een url is', async () => {
            await toon({ likes: [boeken, thee], dislikes: [sokken], canEdit: false });
            const views = el().querySelectorAll('gimmi-extra-info-view');
            expect(views[0].textContent).toContain('Waarmee kan je Ria een plezier doen?');
            expect(views[1].textContent).toContain('Wat krijgt Ria liever niet?');
            const links = Array.from(views[0].querySelectorAll('a')) as HTMLAnchorElement[];
            expect(links.map(a => [a.textContent, a.getAttribute('href'), a.target])).toEqual([['Thee', 'https://thee.be', '_blank']]);
            expect(views[0].querySelector('li span').textContent).toBe('Boeken');
            expect(views[1].querySelector('li').textContent.trim()).toBe('Sokken');
        });

        it('een lege lijst toont niets, ook geen kop', async () => {
            await toon({ likes: [boeken], dislikes: [], canEdit: false });
            expect(el().querySelectorAll('gimmi-extra-info-view')[1].textContent.trim()).toBe('');
        });

        it('een ander ziet geen potlood en geen uitnodiging om info toe te voegen', async () => {
            await toon({ canEdit: false });
            const verborgen = Array.from(el().querySelectorAll('div[hidden]')).map(d => d.textContent.trim());
            expect(verborgen).toContain('Voeg extra info over jezelf toe...');
            expect(potlood().hidden).toBe(true);
        });

        it('de persoon zelf zonder info: uitnodiging en potlood zichtbaar', async () => {
            await toon({ canEdit: true });
            const hint = Array.from(el().querySelectorAll('div')).find(d => d.textContent.trim() === 'Voeg extra info over jezelf toe...');
            expect(hint.hidden).toBe(false);
            expect(potlood().hidden).toBe(false);
        });

        it('de persoon zelf met info: geen uitnodiging meer', async () => {
            await toon({ likes: [boeken], canEdit: true });
            const hint = Array.from(el().querySelectorAll('div')).find(d => d.textContent.trim() === 'Voeg extra info over jezelf toe...');
            expect(hint.hidden).toBe(true);
        });
    });

    describe('bewerkmodus (sc-2375)', () => {
        it('het potlood opent een formulier met de bestaande items', async () => {
            await toon({ likes: [boeken, thee], dislikes: [sokken], canEdit: true });
            await bewerk();
            expect(rijen('likes').map(r => r.map(i => i.value))).toEqual([['Boeken', ''], ['Thee', 'https://thee.be']]);
            expect(rijen('dislikes').map(r => r.map(i => i.value))).toEqual([['Sokken', '']]);
            expect(el().textContent).toContain('Waarmee kan men je een plezier doen?');
            expect(el().textContent).toContain('Wat krijgt je liever niet?');
        });

        it('een lege lijn is ongeldig: melding, geen nieuwe lijn en niet bewaren', async () => {
            await toon({ likes: [boeken], canEdit: true });
            await bewerk();
            const plus = el().querySelector('gimmi-extra-info-edit button[aria-label="Voeg een lijn toe"]') as HTMLButtonElement;
            plus.click();
            await fixture.whenStable();
            expect(rijen('likes').length).toBe(2);
            expect(el().textContent).toContain('Beschrijving moet ingevuld worden (of verwijder lege lijn)');
            expect(plus.disabled).toBe(true);
            expect(bewaarKnop().disabled).toBe(true);

            await typ(rijen('likes')[1][0], 'Puzzels');
            expect(plus.disabled).toBe(false);
            expect(bewaarKnop().disabled).toBe(false);
        });

        it('een link zonder http(s):// is ongeldig', async () => {
            await toon({ likes: [boeken], canEdit: true });
            await bewerk();
            await typ(rijen('likes')[0][1], 'thee.be');
            expect(bewaarKnop().disabled).toBe(true);
            expect(el().textContent).toContain('Geef een volledige link in');
            await typ(rijen('likes')[0][1], 'https://thee.be');
            expect(bewaarKnop().disabled).toBe(false);
        });

        it('een lijn verwijderen met het vuilbakje', async () => {
            await toon({ likes: [boeken, thee], canEdit: true });
            await bewerk();
            el().querySelector<HTMLElement>('gimmi-extra-info-edit .col-1 button').click();
            await fixture.whenStable();
            expect(rijen('likes').map(r => r[0].value)).toEqual(['Thee']);
        });

        it('bewaren stuurt beide lijsten (lege link als null) en geeft het profiel door', async () => {
            const bijgewerkt = { id: 'ria' } as PersonProfile;
            people.updatePreferences.mockReturnValue(of(bijgewerkt));
            await toon({ likes: [boeken], dislikes: [sokken], canEdit: true });
            const opgeslagen = vi.fn().mockName('saved');
            fixture.componentInstance.saved.subscribe(opgeslagen);
            await bewerk();
            await typ(rijen('likes')[0][0], ' Puzzels ');
            bewaarKnop().click();
            await fixture.whenStable();

            expect(people.updatePreferences).toHaveBeenCalledWith('ria', { likes: [{ text: 'Puzzels', url: null }], dislikes: [sokken] });
            expect(opgeslagen).toHaveBeenCalledWith(bijgewerkt);
            expect(el().querySelector('gimmi-extra-info-edit')).toBeNull();
        });

        it('een fout van de server wordt gemeld en laat het formulier open', async () => {
            const problem = new ApiProblem({ status: 403, code: 'forbidden' as never });
            people.updatePreferences.mockReturnValue(throwError(() => problem));
            await toon({ likes: [boeken], canEdit: true });
            await bewerk();
            bewaarKnop().click();
            await fixture.whenStable();
            expect(problems.show).toHaveBeenCalledWith(problem);
            expect(el().querySelector('gimmi-extra-info-edit')).not.toBeNull();
        });

        it('annuleren sluit het formulier zonder te bewaren; opnieuw openen begint van de bestaande items', async () => {
            await toon({ likes: [boeken], canEdit: true });
            await bewerk();
            await typ(rijen('likes')[0][0], 'Iets anders');
            el().querySelector<HTMLElement>('button[aria-label="Wijzigingen annuleren"]').click();
            await fixture.whenStable();
            expect(el().querySelector('gimmi-extra-info-edit')).toBeNull();
            expect(people.updatePreferences).not.toHaveBeenCalled();

            await bewerk();
            expect(rijen('likes').map(r => r[0].value)).toEqual(['Boeken']);
        });
    });
});
