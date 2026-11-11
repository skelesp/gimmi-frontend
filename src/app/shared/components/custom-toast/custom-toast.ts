import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Toast } from '../../../core/toaster';
import { CursorPointer } from '../../directives/cursor-pointer';

@Component({
    selector: 'gimmi-custom-toast',
    templateUrl: './custom-toast.html',
    styleUrls: ['./custom-toast.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer]
})
export class CustomToast {
  @Input() toast: Toast;

}
