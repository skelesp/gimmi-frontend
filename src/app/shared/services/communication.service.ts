import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { NotificationService } from './notification.service';
export interface MailInfo {
  to: string,
  subject: string,
  html: string
}
@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private http$ = inject(HttpClient);
  private notificationService = inject(NotificationService);


  /**
   * @method @public
   * @description Send an email via Gimmi communication API.
   * @param mail Info about the mail to be sent (required : to, subject, html) 
   */
  public sendMail (mailInfo: MailInfo) : void {
    this.http$.post<string>(environment.apiUrl + 'email', mailInfo)
      .subscribe((result: string) => {
        console.info('Mail sent:' + result);
        this.notificationService.showNotification("De mail werd verzonden.", 'success');
      }, (error: HttpErrorResponse) => {
        if (error.status !== 401) {
          this.notificationService.showNotification("Er ging iets mis bij het verzenden van de mail. Probeer nog eens, aub.", 'error');
        }
      });
  }
}
