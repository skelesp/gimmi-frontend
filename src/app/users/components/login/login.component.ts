import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { DynamicFormGroup } from '../../../shared/components/form-components/dynamic-form-group';
import { UserService } from '../../service/user.service';
import { ILocalLoginInfo } from "../../models/user.model";
import { environment } from 'src/environments/environment';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { RouterLink } from '@angular/router';

import { ForgotPasswordLinkComponent } from '../forgot-password-link/forgot-password-link.component';
import { EmailInputComponent } from '../../../shared/components/form-components/email-input/email-input.component';
import { PasswordInputComponent } from '../../../shared/components/form-components/password-input/password-input.component';

@Component({
    selector: 'gimmi-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointerDirective, RouterLink, ForgotPasswordLinkComponent, FormsModule, ReactiveFormsModule, EmailInputComponent, PasswordInputComponent]
})
export class LoginComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);

  loginForm: DynamicFormGroup;
  readonly authenticationError = signal(false);
  readonly loggedInUser = toSignal(this.userService.currentUser$);
  redirectUrl: string;

  ngOnInit(): void {
    this.loginForm = new FormGroup({});

    // RedirectUrl only used to show in component 
    this.redirectUrl = this.userService.attemptedUrl ? environment.rootSiteUrl + this.userService.attemptedUrl : null;
  }

  login() {
    const credentials : ILocalLoginInfo = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    }
    this.userService.authenticate( credentials ).subscribe( user => {
      // Form handling
      this.authenticationError.set(false);
      this.loginForm.reset();
      
      this.userService.showAuthenticationConfirmation();
      this.userService.redirectAfterAuthentication();

    }, error => {
      console.error(error);
      this.authenticationError.set(true);
    });
  }

  ngOnDestroy () {
    this.userService.attemptedUrl = null;
  }
}
