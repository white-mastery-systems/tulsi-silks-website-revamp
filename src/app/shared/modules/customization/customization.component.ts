import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommonService } from '../../../services/common.service';

@Component({
    selector: 'app-customization',
    templateUrl: './customization.component.html',
    styleUrls: ['./customization.component.scss'],
    standalone: false
})

export class CustomizationComponent {

  imgBaseUrl: string = environment.img_baseurl;

  constructor(public commonService: CommonService) { }

  openCustomDetails() {
    this.commonService.customView = false;
    this.commonService.measurementView = false;
    this.commonService.notesView = false;
    if(this.commonService.selected_model) {
      if(this.commonService.selected_model.custom_list.length) this.commonService.customView = true;
      else if(this.commonService.selected_model.mm_sets.length) this.commonService.measurementView = true;
      else if(this.commonService.selected_model.notes_list.length) this.commonService.notesView = true;
    }
  }

}