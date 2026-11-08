import { Component, Input } from '@angular/core';
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

type BannerColors = 'danger' | 'warning' | 'success';
export interface BannerConfig { 
  text: string, 
  backgroundColor: BannerColors, 
  bannerIcon: IconDefinition 
}
@Component({
    selector: 'gimmi-wish-banner',
    templateUrl: './wish-banner.component.html',
    styleUrls: ['./wish-banner.component.css'],
    standalone: false
})
export class WishBannerComponent {
  @Input() bannerConfig : BannerConfig = {text: null, backgroundColor: null, bannerIcon: null};

}
