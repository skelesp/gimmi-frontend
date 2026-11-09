import { Component, Input, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { ILike } from 'src/app/people/models/person.model';
import { itemTypes } from '../extra-info';


@Component({
    selector: 'gimmi-extra-info-view',
    templateUrl: './extra-info-view.html',
    styleUrls: ['./extra-info-view.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: []
})
export class ExtraInfoView implements OnInit {
  readonly firstName = input<string>(undefined);
  @Input() items: ILike[] = [];
  readonly itemType = input<itemTypes>(undefined);

  constructor() { }

  ngOnInit(): void {
  }

}
