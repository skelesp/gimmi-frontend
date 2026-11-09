import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { ClipboardModule } from 'ngx-clipboard';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-copy-to-clipboard-button',
    templateUrl: './copy-to-clipboard-button.component.html',
    styleUrls: ['./copy-to-clipboard-button.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ClipboardModule, FaIconComponent]
})
export class CopyToClipboardButtonComponent{
  private notificationService = inject(NotificationService);

  @Input() url: string;
  copyIcon : IconDefinition = faCopy;

  handleSuccess () : void {
    this.notificationService.showNotification(
      "De link is gekopieerd, je kan deze nu plakken in een bericht, mail, ...",
      "success",
      "Link gekopieerd"
    );
  }

  handleError () : void {
    this.notificationService.showNotification(
      "De link is niet gekopieerd, probeer opnieuw aub.",
      "error",
      "Link niet gekopieerd"
    );
  }

}
