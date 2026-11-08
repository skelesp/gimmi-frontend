import { Component, Input } from '@angular/core';
import { Toast } from '../../services/toaster.service';

@Component({
    selector: 'gimmi-custom-toast',
    templateUrl: './custom-toast.component.html',
    styleUrls: ['./custom-toast.component.css'],
    standalone: false
})
export class CustomToastComponent {
  @Input() toast: Toast;

}
