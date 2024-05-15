import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicAssetLoaderService } from 'src/app/services/dynamic-asset-loader.service';
import { StoreApiService } from 'src/app/services/store-api.service';
import { WishlistService } from 'src/app/services/wishlist.service';
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

  constructor(
    private api: StoreApiService, private activeRoute: ActivatedRoute, public commonService: CommonService, private wishService: WishlistService,
    @Inject(PLATFORM_ID) private platformId: Object, private assetLoader: DynamicAssetLoaderService, private router: Router
  ) {
    this.assetLoader.load('web-story-js1', 'web-story-js2').then(() => { });
  }

  ngOnInit(): void {
    this.pageLoader = false;
    this.activeRoute.params.subscribe((params: Params) => {
      this.pageLoader = true;
      this.api.WEBSTORY_DETAILS(params['story_id']).subscribe(result => {
        if(result.status) {
          let storyData = result.data;
          this.list = storyData.list;
          if(storyData.seo_status) {
            let seoImage = this.imgBaseUrl+storyData.image;
            this.commonService.setSiteMetaData(storyData.seo_details, seoImage);
          }
          else this.commonService.getStoreSeoDetails();
        }
        else {
          console.log("response", result);
          this.router.navigate(['/web-stories'])
        }
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    });
  }

  ngOnDestroy() {
    if(isPlatformBrowser(this.platformId)) window.location.reload();
    this.commonService.menu_list = [];
    this.commonService.announcementBar = "";
    this.commonService.currency_types = [];
    this.wishService.wish_list = [];
  }

}