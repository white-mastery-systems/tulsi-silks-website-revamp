import { Component, OnInit } from '@angular/core';
import { StoreApiService } from 'src/app/services/store-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-stories',
  templateUrl: './stories.component.html',
  styleUrls: ['./stories.component.scss']
})

export class StoriesComponent implements OnInit {

  list: any = [];
  imgBaseUrl: string = environment.img_baseurl;
  constructor(private api: StoreApiService) {}

  ngOnInit(): void {
    this.api.WEBSTORY_LIST(0, 10).subscribe((result) => {
      if(result.status) this.list = result.list;
      else console.log("response", result);
    });
  }

}