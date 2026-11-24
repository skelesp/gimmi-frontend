import { Service, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

/** The browser tab title: `<environment title> | <page title>`, for example `[TEST] Gimmi | Inloggen`. */
@Service()
export class PageTitle {
  private title = inject(Title);

  /** Sets the tab title; without a page title only the environment title stays. */
  set(pageTitle: string | null | undefined): void {
    this.title.setTitle(pageTitle ? `${environment.title} | ${pageTitle}` : environment.title);
  }
}
