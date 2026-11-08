import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { LandingPageRoutingModule } from './landing-page-routing.module';
import { PeopleModule } from '../people/people.module';

import { LandingPageComponent } from './landing-page.component';
import { LandingPageBannerComponent } from './landing-page-banner/landing-page-banner.component';
import { HowToUseComponent } from './how-to-use/how-to-use.component';


@NgModule({
    imports: [
        CommonModule,
        LandingPageRoutingModule,
        SharedModule,
        PeopleModule,
        LandingPageComponent,
        LandingPageBannerComponent,
        HowToUseComponent
    ]
})
export class LandingPageModule { }
