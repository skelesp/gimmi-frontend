import { Component, OnInit, ChangeDetectionStrategy, input } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormGroup } from '../../../../shared/components/form-components/dynamic-form-group';
import { ILike } from 'src/app/people/models/person.model';
import { itemTypes } from '../extra-info';
import { faPlus, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';

@Component({
    selector: 'gimmi-extra-info-edit',
    templateUrl: './extra-info-edit.html',
    styleUrls: ['./extra-info-edit.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, FaIconComponent, CursorPointer]
})
export class ExtraInfoEdit implements OnInit {
  readonly firstName = input<string>(undefined);
  readonly items = input<ILike[]>([]);
  readonly itemType = input<itemTypes>(undefined);
  readonly parentForm = input<DynamicFormGroup>(undefined);

  formItems = new FormArray<FormGroup<{ text: FormControl<string>; url: FormControl<string> }>>([]);

  deleteIcon = faTrashAlt;
  addIcon = faPlus;
  
  constructor() { }

  ngOnInit(): void {
    this.items()?.forEach(item => {
      this.addItem(item);
    });

    this.parentForm().addControl(this.itemType(), this.formItems);
  }

  addItem(item: ILike = { text:'', url: ''} ) {
    const itemControlGroup = new FormGroup({
      text: new FormControl(item.text, { nonNullable: true, validators: Validators.required }),
      url: new FormControl(item.url, { nonNullable: true })
    })
    this.formItems.push(itemControlGroup);
  }

  removeItem (index : number) {
    this.formItems.removeAt(index);
  }

}
