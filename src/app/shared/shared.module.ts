import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from "@angular/common/http";
import { RouterModule } from '@angular/router';

import { ImagesModule } from '../images/images.module';
import { ClipboardModule } from 'ngx-clipboard';

import { BrandLogoComponent } from './components/brand-logo/brand-logo.component';
import { CursorPointerDirective } from './directives/cursor-pointer.directive';
import { CustomToastComponent } from './components/custom-toast/custom-toast.component';
import { BindQueryparamToInputDirective } from './directives/bind-queryparam-to-input.directive';
import { EmailInputComponent } from './components/form-components/email-input/email-input.component';
import { PasswordInputComponent } from './components/form-components/password-input/password-input.component';
import { PasswordCheckComponent } from './components/form-components/password-check/password-check.component';
import { SocialButtonsComponent } from './components/social-buttons/social-buttons.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';

@NgModule({
    exports: [
        CommonModule,
        NgbModule,
        FontAwesomeModule,
        FormsModule,
        ReactiveFormsModule,
        BrandLogoComponent,
        CursorPointerDirective,
        CustomToastComponent,
        BindQueryparamToInputDirective,
        EmailInputComponent,
        PasswordInputComponent,
        PasswordCheckComponent,
        ImagesModule,
        ClipboardModule,
        PrivacyPolicyComponent,
        SocialButtonsComponent
    ], imports: [CommonModule,
        NgbModule,
        FontAwesomeModule,
        FormsModule,
        RouterModule,
        ReactiveFormsModule,
        ImagesModule,
        ClipboardModule, BrandLogoComponent,
        CursorPointerDirective,
        CustomToastComponent,
        BindQueryparamToInputDirective,
        EmailInputComponent,
        PasswordInputComponent,
        PasswordCheckComponent,
        SocialButtonsComponent,
        PrivacyPolicyComponent], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi())] })
export class SharedModule { }
