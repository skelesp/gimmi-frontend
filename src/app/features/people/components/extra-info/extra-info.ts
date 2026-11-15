import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { applyEach, form, pattern, required, submit } from '@angular/forms/signals';
import { faCheck, faPencilAlt, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import { ApiProblem } from '../../../../core/api/api-problem';
import { ProblemNotifier } from '../../../../core/api/problem-notifier';
import { Notifications } from '../../../../core/notifications';
import { People, PersonPreference, PersonProfile } from '../../service/people';
import { ExtraInfoEdit } from './extra-info-edit/extra-info-edit';
import { ExtraInfoView } from './extra-info-view/extra-info-view';

export type itemTypes = 'likes' | 'dislikes';

/** A like or dislike while it is edited: an empty link is `''` here and `null` for the server. */
export interface PreferenceRow {
  text: string;
  url: string;
}

const emptyUrlOrHttp = /^$|^https?:\/\/\S+$/i;

const toRows = (items: PersonPreference[]): PreferenceRow[] => items.map(({ text, url }) => ({ text, url: url ?? '' }));
const toPreferences = (rows: PreferenceRow[]): PersonPreference[] =>
  rows.map(({ text, url }) => ({ text: text.trim(), url: url.trim() || null }));

@Component({
    selector: 'gimmi-extra-info',
    templateUrl: './extra-info.html',
    styleUrls: ['./extra-info.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ExtraInfoView, ExtraInfoEdit, FaIconComponent]
})
export class ExtraInfo {
  private people = inject(People);
  private problems = inject(ProblemNotifier);
  private notifications = inject(Notifications);

  readonly personId = input.required<string>();
  readonly firstName = input<string>();
  readonly likes = input<PersonPreference[]>([]);
  readonly dislikes = input<PersonPreference[]>([]);
  /** From `viewer.can.update`: only the person themselves may change this. */
  readonly canEdit = input(false);
  readonly saved = output<PersonProfile>();

  protected readonly editing = signal(false);
  protected readonly preferences = signal<{ likes: PreferenceRow[]; dislikes: PreferenceRow[] }>({ likes: [], dislikes: [] });
  protected readonly preferencesForm = form(this.preferences, path => {
    for (const list of [path.likes, path.dislikes]) {
      applyEach(list, row => {
        required(row.text, { message: 'Beschrijving moet ingevuld worden' });
        pattern(row.url, emptyUrlOrHttp, { message: 'Geef een volledige link in (begint met http:// of https://)' });
      });
    }
  });

  protected pencilIcon = faPencilAlt;
  protected checkIcon = faCheck;
  protected cancelIcon = faTimes;

  protected edit() {
    this.preferences.set({ likes: toRows(this.likes()), dislikes: toRows(this.dislikes()) });
    this.editing.set(true);
  }

  protected cancel() {
    this.editing.set(false);
  }

  protected save(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.preferencesForm, async () => {
      const { likes, dislikes } = this.preferences();
      try {
        const profile = await firstValueFrom(this.people.updatePreferences(this.personId(), {
          likes: toPreferences(likes),
          dislikes: toPreferences(dislikes)
        }));
        this.editing.set(false);
        this.saved.emit(profile);
      } catch (error) {
        if (error instanceof ApiProblem) {
          this.problems.show(error);
        } else {
          console.error(error);
          this.notifications.showNotification('Opslaan lukt nu niet. Probeer het straks opnieuw.', 'error');
        }
      }
    });
  }
}
