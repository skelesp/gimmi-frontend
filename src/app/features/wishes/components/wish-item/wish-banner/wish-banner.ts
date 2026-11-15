import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

type BannerColors = 'danger' | 'warning' | 'success';
export interface BannerConfig { 
  text: string, 
  backgroundColor: BannerColors, 
  bannerIcon: IconDefinition 
}
@Component({
    selector: 'gimmi-wish-banner',
    templateUrl: './wish-banner.html',
    styleUrls: ['./wish-banner.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FaIconComponent]
})
export class WishBanner {
  @Input() bannerConfig : BannerConfig = {text: null, backgroundColor: null, bannerIcon: null};

}
