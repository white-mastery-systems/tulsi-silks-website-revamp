import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})

export class ProfileComponent {

  template_setting: any = environment.template_setting;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "My Account", position: 2, link: "/account" },
    { name: "My Profile", position: 3, link: "/account/profile" }
  ];

  constructor(public commonService: CommonService) {
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

}