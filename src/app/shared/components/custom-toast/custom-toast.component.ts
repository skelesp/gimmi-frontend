import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Toast } from '../../services/toaster.service';
import { CursorPointerDirective } from '../../directives/cursor-pointer.directive';

@Component({
    selector: 'gimmi-custom-toast',
    templateUrl: './custom-toast.component.html',
    styleUrls: ['./custom-toast.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointerDirective]
})
export class CustomToastComponent {
  @Input() toast: Toast;

}
