import { Component, Input, OnInit, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormControl, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormGroup } from '../dynamic-form-group';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { faAt } from '@fortawesome/free-solid-svg-icons'
import { PeopleService } from 'src/app/people/service/people.service';
import { Person } from 'src/app/people/models/person.model';

import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { BindQueryparamToInput } from '../../../directives/bind-queryparam-to-input';
import { RouterLink } from '@angular/router';
import { CursorPointer } from '../../../directives/cursor-pointer';

type EmailExistsRedirectType = "wishlist" | "login";
@Component({
    selector: 'gimmi-email-input',
    templateUrl: './email-input.html',
    styleUrls: ['./email-input.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, FaIconComponent, BindQueryparamToInput, RouterLink, CursorPointer]
})
export class EmailInput implements OnInit {
  private _peopleService = inject(PeopleService);

  @Input() parentFormGroup: DynamicFormGroup;
  @Input() label: string = null;
  readonly bindedQueryParam = input<string>(null);
  @Input() controlName = 'email';
  readonly placeholder = input('Email (login)');
  readonly emailExistsValidation = input(false);
  readonly emailExistsRedirectTo = input<EmailExistsRedirectType>("wishlist");

  mailIcon = faAt;
  readonly knownPerson = signal<Person>(undefined);

  ngOnInit(): void {
    const emailControlOptions : AbstractControlOptions = {
      validators: [Validators.required, Validators.email]
    };
    if (this.emailExistsValidation()) {
      emailControlOptions.asyncValidators = this.emailExists.bind(this);
      emailControlOptions.updateOn = 'blur'
    }
    this.parentFormGroup.addControl(
      this.controlName,
      new FormControl<string | null>(null, emailControlOptions)
    );
  }

  emailExists(control: AbstractControl): Observable<ValidationErrors | null> {
    return this._peopleService.findPersonByEmail(control.value)
      .pipe(
        tap(value => this.knownPerson.set(value)),
        map(personResult => { return { 'emailExists': true } }),
        catchError(error => { return of(null) })
      );
  }

}
