import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../../services/common.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-checkout-header',
  templateUrl: './checkout-header.component.html',
  styleUrls: ['./checkout-header.component.scss']
})

export class CheckoutHeaderComponent implements OnInit {

  leftLogo: boolean;
  template_setting: any = environment.template_setting;
  imgBaseUrl: string = environment.img_baseurl;

  constructor(public commonService: CommonService) { }

  ngOnInit(): void {
    if(environment.header_type=='type-1' || environment.header_type=='type-6' || environment.header_type=='type-7') {
      this.leftLogo = true;
    }
  }

}