import { Component, Input, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { ILike } from 'src/app/people/models/person.model';
import { itemTypes } from '../extra-info.component';


@Component({
    selector: 'gimmi-extra-info-view',
    templateUrl: './extra-info-view.component.html',
    styleUrls: ['./extra-info-view.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: []
})
export class ExtraInfoViewComponent implements OnInit {
  readonly firstName = input<string>(undefined);
  @Input() items: ILike[] = [];
  readonly itemType = input<itemTypes>(undefined);

  constructor() { }

  ngOnInit(): void {
  }

}
