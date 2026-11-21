import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'gimmi-privacy',
  templateUrl: './privacy.html',
  styleUrl: './privacy.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Privacy {
  readonly updated = '21 november 2026';
  readonly contact = 'stijn.beeckmans@gmail.com';
}
