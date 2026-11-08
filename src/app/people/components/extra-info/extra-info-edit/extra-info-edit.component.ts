import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ILike } from 'src/app/people/models/person.model';
import { itemTypes } from '../extra-info.component';
import { faPlus, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

@Component({
    selector: 'gimmi-extra-info-edit',
    templateUrl: './extra-info-edit.component.html',
    styleUrls: ['./extra-info-edit.component.css'],
    standalone: false
})
export class ExtraInfoEditComponent implements OnInit {
  @Input() firstName: string;
  @Input() items: ILike[] = [];
  @Input() itemType: itemTypes;
  @Input() parentForm: UntypedFormGroup;

  formItems: UntypedFormArray = new UntypedFormArray([]);

  deleteIcon = faTrashAlt;
  addIcon = faPlus;
  
  constructor() { }

  ngOnInit(): void {
    this.items?.forEach(item => {
      this.addItem(item);
    });

    this.parentForm.addControl(this.itemType, this.formItems);
  }

  addItem(item: ILike = { text:'', url: ''} ) {
    const itemControlGroup = new UntypedFormGroup({
      text: new UntypedFormControl(item.text, Validators.required),
      url: new UntypedFormControl(item.url)
    })
    this.formItems.push(itemControlGroup);
  }

  removeItem (index : number) {
    this.formItems.removeAt(index);
  }

}
