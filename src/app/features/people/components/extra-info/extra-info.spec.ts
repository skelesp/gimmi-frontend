import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiProblem } from '../../../../core/api/api-problem';
import { ProblemNotifier } from '../../../../core/api/problem-notifier';
import { People, PersonPreference, PersonProfile } from '../../service/people';
import { ExtraInfo } from './extra-info';

// Extra info about a person: what they like and would rather not get. Read mode (sc-1989) and
// edit mode (sc-2375), only for the person themselves (`viewer.can.update`).
describe('ExtraInfo', () => {
    let fixture: ComponentFixture<ExtraInfo>;
    let people: { updatePreferences: ReturnType<typeof vi.fn> };
    let problems: { show: ReturnType<typeof vi.fn> };
    const books: PersonPreference = { text: 'Boeken', url: null };
    const tea: PersonPreference = { text: 'Thee', url: 'https://thee.be' };
    const socks: PersonPreference = { text: 'Sokken', url: null };

    async function show(options: { likes?: PersonPreference[]; dislikes?: PersonPreference[]; canEdit: boolean }) {
        fixture = TestBed.createComponent(ExtraInfo);
        fixture.componentRef.setInput('personId', 'ria');
        fixture.componentRef.setInput('firstName', 'Ria');
        fixture.componentRef.setInput('likes', options.likes ?? []);
        fixture.componentRef.setInput('dislikes', options.dislikes ?? []);
        fixture.componentRef.setInput('canEdit', options.canEdit);
        await fixture.whenStable();
    }

    function el(): HTMLElement { return fixture.nativeElement; }

    function pencil(): HTMLElement {
        // The hidden container of the pencil button.
        return el().querySelector<HTMLElement>('button[aria-label="Extra info aanpassen"]').parentElement;
    }

    async function startEdit() {
        el().querySelector<HTMLElement>('button[aria-label="Extra info aanpassen"]').click();
        await fixture.whenStable();
    }

    function rows(type: 'likes' | 'dislikes'): HTMLInputElement[][] {
        const edit = el().querySelectorAll('gimmi-extra-info-edit')[type === 'likes' ? 0 : 1];
        return Array.from(edit.querySelectorAll('.row')).map(r => Array.from(r.querySelectorAll('input')) as HTMLInputElement[]);
    }

    async function typeInto(input: HTMLInputElement, value: string) {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        await fixture.whenStable();
    }

    function saveButton(): HTMLButtonElement { return el().querySelector('button[type="submit"]'); }

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
        it('shows what the person likes and would rather not get, with a link where there is a url', async () => {
            await show({ likes: [books, tea], dislikes: [socks], canEdit: false });
            const views = el().querySelectorAll('gimmi-extra-info-view');
            expect(views[0].textContent).toContain('Waarmee kan je Ria een plezier doen?');
            expect(views[1].textContent).toContain('Wat krijgt Ria liever niet?');
            const links = Array.from(views[0].querySelectorAll('a')) as HTMLAnchorElement[];
            expect(links.map(a => [a.textContent, a.getAttribute('href'), a.target])).toEqual([['Thee', 'https://thee.be', '_blank']]);
            expect(views[0].querySelector('li span').textContent).toBe('Boeken');
            expect(views[1].querySelector('li').textContent.trim()).toBe('Sokken');
        });

        it('an empty list shows nothing, not even a heading', async () => {
            await show({ likes: [books], dislikes: [], canEdit: false });
            expect(el().querySelectorAll('gimmi-extra-info-view')[1].textContent.trim()).toBe('');
        });

        it('someone else sees no pencil and no invitation to add info', async () => {
            await show({ canEdit: false });
            const hiddenTexts = Array.from(el().querySelectorAll('div[hidden]')).map(d => d.textContent.trim());
            expect(hiddenTexts).toContain('Voeg extra info over jezelf toe...');
            expect(pencil().hidden).toBe(true);
        });

        it('the person themselves without info: invitation and pencil visible', async () => {
            await show({ canEdit: true });
            const hint = Array.from(el().querySelectorAll('div')).find(d => d.textContent.trim() === 'Voeg extra info over jezelf toe...');
            expect(hint.hidden).toBe(false);
            expect(pencil().hidden).toBe(false);
        });

        it('the person themselves with info: no invitation any more', async () => {
            await show({ likes: [books], canEdit: true });
            const hint = Array.from(el().querySelectorAll('div')).find(d => d.textContent.trim() === 'Voeg extra info over jezelf toe...');
            expect(hint.hidden).toBe(true);
        });
    });

    describe('bewerkmodus (sc-2375)', () => {
        it('the pencil opens a form with the existing items', async () => {
            await show({ likes: [books, tea], dislikes: [socks], canEdit: true });
            await startEdit();
            expect(rows('likes').map(r => r.map(i => i.value))).toEqual([['Boeken', ''], ['Thee', 'https://thee.be']]);
            expect(rows('dislikes').map(r => r.map(i => i.value))).toEqual([['Sokken', '']]);
            expect(el().textContent).toContain('Waarmee kan men je een plezier doen?');
            expect(el().textContent).toContain('Wat krijgt je liever niet?');
        });

        it('an empty line is invalid: notice, no new line and do not save', async () => {
            await show({ likes: [books], canEdit: true });
            await startEdit();
            const plus = el().querySelector('gimmi-extra-info-edit button[aria-label="Voeg een lijn toe"]') as HTMLButtonElement;
            plus.click();
            await fixture.whenStable();
            expect(rows('likes').length).toBe(2);
            expect(el().textContent).toContain('Beschrijving moet ingevuld worden (of verwijder lege lijn)');
            expect(plus.disabled).toBe(true);
            expect(saveButton().disabled).toBe(true);

            await typeInto(rows('likes')[1][0], 'Puzzels');
            expect(plus.disabled).toBe(false);
            expect(saveButton().disabled).toBe(false);
        });

        it('a link without http(s):// is invalid', async () => {
            await show({ likes: [books], canEdit: true });
            await startEdit();
            await typeInto(rows('likes')[0][1], 'thee.be');
            expect(saveButton().disabled).toBe(true);
            expect(el().textContent).toContain('Geef een volledige link in');
            await typeInto(rows('likes')[0][1], 'https://thee.be');
            expect(saveButton().disabled).toBe(false);
        });

        it('deleting a line with the bin', async () => {
            await show({ likes: [books, tea], canEdit: true });
            await startEdit();
            el().querySelector<HTMLElement>('gimmi-extra-info-edit .col-1 button').click();
            await fixture.whenStable();
            expect(rows('likes').map(r => r[0].value)).toEqual(['Thee']);
        });

        it('saving sends both lists (empty link as null) and passes on the profile', async () => {
            const updated = { id: 'ria' } as PersonProfile;
            people.updatePreferences.mockReturnValue(of(updated));
            await show({ likes: [books], dislikes: [socks], canEdit: true });
            const saved = vi.fn().mockName('saved');
            fixture.componentInstance.saved.subscribe(saved);
            await startEdit();
            await typeInto(rows('likes')[0][0], ' Puzzels ');
            saveButton().click();
            await fixture.whenStable();

            expect(people.updatePreferences).toHaveBeenCalledWith('ria', { likes: [{ text: 'Puzzels', url: null }], dislikes: [socks] });
            expect(saved).toHaveBeenCalledWith(updated);
            expect(el().querySelector('gimmi-extra-info-edit')).toBeNull();
        });

        it('an error from the server is reported and leaves the form open', async () => {
            const problem = new ApiProblem({ status: 403, code: 'forbidden' as never });
            people.updatePreferences.mockReturnValue(throwError(() => problem));
            await show({ likes: [books], canEdit: true });
            await startEdit();
            saveButton().click();
            await fixture.whenStable();
            expect(problems.show).toHaveBeenCalledWith(problem);
            expect(el().querySelector('gimmi-extra-info-edit')).not.toBeNull();
        });

        it('cancelling closes the form without saving; reopening starts from the existing items', async () => {
            await show({ likes: [books], canEdit: true });
            await startEdit();
            await typeInto(rows('likes')[0][0], 'Iets anders');
            el().querySelector<HTMLElement>('button[aria-label="Wijzigingen annuleren"]').click();
            await fixture.whenStable();
            expect(el().querySelector('gimmi-extra-info-edit')).toBeNull();
            expect(people.updatePreferences).not.toHaveBeenCalled();

            await startEdit();
            expect(rows('likes').map(r => r[0].value)).toEqual(['Boeken']);
        });
    });
});
