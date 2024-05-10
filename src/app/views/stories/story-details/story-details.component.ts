import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { StoreApiService } from 'src/app/services/store-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-story-details',
  templateUrl: './story-details.component.html',
  styleUrls: ['./story-details.component.scss']
})

export class StoryDetailsComponent {

  pageLoader: Boolean;
  imgBaseUrl: string = environment.img_baseurl;
  list: any = [];

  constructor(private api: StoreApiService, private activeRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.pageLoader = false;
    this.activeRoute.params.subscribe((params: Params) => {
      this.pageLoader = true;
      this.api.WEBSTORY_DETAILS(params['story_id']).subscribe(result => {
        if(result.status) this.list = result.data.list;
        else console.log("response", result);
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    });
  }

}