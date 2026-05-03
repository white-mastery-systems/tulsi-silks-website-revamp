import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-not-found',
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.scss'],
    standalone: false
})

export class NotFoundComponent {

  template_setting: any = environment.template_setting;
  seoDetails: any = {
    h1_tag: "Tulsi silks | Page Not Found",
    page_title: "Tulsi silks | Page Not Found",
    meta_desc: "The page you're looking for isn't here. Explore our exquisite collection of sarees, fabrics, and accessories at Tulsi Silks. Discover timeless elegance and traditional craftsmanship. Visit us today",
    meta_keywords: []
  };

  constructor(private commonService: CommonService) {
    this.commonService.setSiteMetaData(this.seoDetails, null);
  }

}