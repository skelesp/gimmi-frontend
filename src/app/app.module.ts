import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { UsersModule } from './users/users.module';
import { PeopleModule } from './people/people.module';
import { WishesModule } from './wishes/wishes.module';

import { NavigationBarComponent } from './shared/components/navigation-bar/navigation-bar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigationBarComponent,
    ToastContainerComponent
  ],
  imports: [
    BrowserModule,
    SharedModule,
    PeopleModule,
    UsersModule,
    WishesModule,
    BrowserAnimationsModule,
    AppRoutingModule,
  ],
  providers: [ Title ],
  bootstrap: [AppComponent]
})
export class AppModule { }
