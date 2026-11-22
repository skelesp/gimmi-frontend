import { Service, inject } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { PageTitle } from './page-title';

/** Sets the tab title from the `title` of the route. Pages that know better (a name, a wish) set it themselves afterwards. */
@Service()
export class PageTitleStrategy extends TitleStrategy {
  private pageTitle = inject(PageTitle);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.pageTitle.set(this.buildTitle(snapshot));
  }
}
