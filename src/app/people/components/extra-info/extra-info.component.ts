import { Component, Input, OnInit, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { IExtraPersonInfo, ILike } from '../../models/person.model';
import { faPencilAlt, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { DynamicFormGroup } from '../../../shared/components/form-components/dynamic-form-group';
import { PeopleService } from '../../service/people.service';
import { ActivatedRoute } from '@angular/router';

import { ExtraInfoViewComponent } from './extra-info-view/extra-info-view.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { ExtraInfoEditComponent } from './extra-info-edit/extra-info-edit.component';

export type itemTypes = 'likes' | 'dislikes'; 
@Component({
    selector: 'gimmi-extra-info',
    templateUrl: './extra-info.component.html',
    styleUrls: ['./extra-info.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ExtraInfoViewComponent, FaIconComponent, CursorPointerDirective, FormsModule, ReactiveFormsModule, ExtraInfoEditComponent]
})
export class ExtraInfoComponent implements OnInit {
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
