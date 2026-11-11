import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PersonPreference } from '../../../service/people';
import { itemTypes } from '../extra-info';

@Component({
    selector: 'gimmi-extra-info-view',
    templateUrl: './extra-info-view.html',
    styleUrls: ['./extra-info-view.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: []
})
export class ExtraInfoView {
  readonly firstName = input<string>(undefined);
  readonly items = input<PersonPreference[]>([]);
  readonly itemType = input<itemTypes>(undefined);
}
