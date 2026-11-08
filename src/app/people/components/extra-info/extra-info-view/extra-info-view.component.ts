import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ILike } from 'src/app/people/models/person.model';
import { itemTypes } from '../extra-info.component';

@Component({
    selector: 'gimmi-extra-info-view',
    templateUrl: './extra-info-view.component.html',
    styleUrls: ['./extra-info-view.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ExtraInfoViewComponent implements OnInit {
  @Input() firstName: string;
  @Input() items: ILike[] = [];
  @Input() itemType: itemTypes;

  constructor() { }

  ngOnInit(): void {
  }

}
