import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { IExtraPersonInfo, ILike } from '../../models/person.model';
import { faPencilAlt, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { UntypedFormGroup } from '@angular/forms';
import { PeopleService } from '../../service/people.service';
import { ActivatedRoute } from '@angular/router';

export type itemTypes = 'like' | 'dislike'; 
@Component({
    selector: 'gimmi-extra-info',
    templateUrl: './extra-info.component.html',
    styleUrls: ['./extra-info.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ExtraInfoComponent implements OnInit {
  @Input() firstName : string;
  @Input() likes: ILike[] = [];
  @Input() dislikes: ILike[] = [];
  @Input() personIsUser = false;
  @Output() extraInfoSaved = new EventEmitter<IExtraPersonInfo>();

  editItemsForm: UntypedFormGroup;
  editMode = false;
  pencilIcon = faPencilAlt;
  checkIcon = faCheck;
  cancelIcon = faTimes;

  constructor( 
    private _peopleService: PeopleService,
    private route: ActivatedRoute
     ) { }

  ngOnInit(): void { 
    this.editItemsForm = new UntypedFormGroup({});
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
    this.editItemsForm = new UntypedFormGroup({}); // This is needed or the edit form will only work the first time extra info is opened in edit mode. There might be better solutions to fix this, but it works as intended now.
  }

}
