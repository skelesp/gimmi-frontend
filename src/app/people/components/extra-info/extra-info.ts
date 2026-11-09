import { Component, Input, OnInit, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { IExtraPersonInfo, ILike } from '../../models/person.model';
import { faPencilAlt, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { DynamicFormGroup } from '../../../shared/components/form-components/dynamic-form-group';
import { PeopleService } from '../../service/people.service';
import { ActivatedRoute } from '@angular/router';

import { ExtraInfoView } from './extra-info-view/extra-info-view';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';
import { ExtraInfoEdit } from './extra-info-edit/extra-info-edit';

export type itemTypes = 'likes' | 'dislikes'; 
@Component({
    selector: 'gimmi-extra-info',
    templateUrl: './extra-info.html',
    styleUrls: ['./extra-info.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ExtraInfoView, FaIconComponent, CursorPointer, FormsModule, ReactiveFormsModule, ExtraInfoEdit]
})
export class ExtraInfo implements OnInit {
  private _peopleService = inject(PeopleService);
  private route = inject(ActivatedRoute);

  @Input() firstName : string;
  @Input() likes: ILike[] = [];
  @Input() dislikes: ILike[] = [];
  @Input() personIsUser = false;
  readonly extraInfoSaved = output<IExtraPersonInfo>();

  editItemsForm: DynamicFormGroup;
  editMode = false;
  pencilIcon = faPencilAlt;
  checkIcon = faCheck;
  cancelIcon = faTimes;

  ngOnInit(): void { 
    this.editItemsForm = new FormGroup({});
  }

  saveExtraInfo () {
    this._peopleService.updateExtraInfo( 
      this.route.snapshot.paramMap.get('personId'), 
      this.editItemsForm.get('likes').value,
      this.editItemsForm.get('dislikes').value)
    .subscribe( person => {
      this.extraInfoSaved.emit({likes: person.extraInfo.likes, dislikes: person.extraInfo.dislikes});
    });
    this.resetEditForm();
  }

  resetEditForm () {
    this.editMode = false;
    this.editItemsForm = new FormGroup({}); // This is needed or the edit form will only work the first time extra info is opened in edit mode. There might be better solutions to fix this, but it works as intended now.
  }

}
