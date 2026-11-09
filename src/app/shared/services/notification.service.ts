import { Injectable, inject } from '@angular/core';
import { Toaster, ToastType } from './toaster.service';

type NotificationType = "success" | "warning" | "info" | "error";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toaster = inject(Toaster);


  showNotification(message: string, type: NotificationType, title?: string): void {
    
    this.toaster.open({
      text: message,
      caption: title || this.setTitle(type),
      type: this.mapToToastType(type)
    });
  }

  private mapToToastType(type: NotificationType): ToastType {
    let toastType: ToastType;

    switch (type) {
      case "error":   
        toastType = "danger";
        break;
      default:
        toastType = type;
        break;
    }
    return toastType;
  }

  private setTitle (type: NotificationType) : string {
    let title  = "Notificatie";
    switch (type) {
      case "success":
        title = "Gelukt!!";       
        break;
      case "error":
        title = "Foutmelding";
        break;
      case "info":
        title = "Info";
        break;
      case "warning":
        title = "Waarschuwing";
        break;
    }
    return title;
  }
}
