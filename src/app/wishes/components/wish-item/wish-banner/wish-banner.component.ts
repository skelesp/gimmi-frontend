import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

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
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass, FaIconComponent]
})
export class WishBannerComponent {
  @Input() bannerConfig : BannerConfig = {text: null, backgroundColor: null, bannerIcon: null};

}
