import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';

@Component({
    selector: 'app-blogs',
    templateUrl: './blogs.component.html',
    styleUrls: ['./blogs.component.scss'],
    standalone: false
})

export class BlogsComponent implements OnInit, OnDestroy {

  page: number = 1; pageSize: number = 12;
  pageLoader = false; list: any = [];
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  seo_details: any = {}; totalPages: number = 0;
  tempList: any = [];
  searchQuery = '';

  get filteredList(): any[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.list;
    return this.list.filter((x: any) =>
      (x.name || '').toLowerCase().includes(q) ||
      (x.category_name || '').toLowerCase().includes(q)
    );
  }
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "Blogs", position: 2, link: "/blogs" }
  ];
  
  constructor(private storeApi: StoreApiService, public commonService: CommonService) { }

  ngOnInit(): void {
    if(this.commonService.blog_page_attr && Object.entries(this.commonService.blog_page_attr).length) {
      this.list = this.commonService.blog_page_attr.list;
      this.page = this.commonService.blog_page_attr.page;
      this.tempList = this.commonService.blog_page_attr.temp_list;
      this.totalPages = this.commonService.blog_page_attr.total_pages;
      let scrollPos = this.commonService.blog_page_attr.scroll_y_pos;
      setTimeout(() => { window.scrollTo({ top: scrollPos, behavior: 'smooth' }); }, 500);
      // SEO
      this.seo_details = this.commonService.blog_page_attr.seo_details;
      if(this.seo_details.status) this.commonService.setSiteMetaData(this.seo_details, null);
      else this.commonService.getStoreSeoDetails();
      delete this.commonService.blog_page_attr;
    }
    else {
      this.page = 1;
      this.getList();
    }
  }

  clearSearch() {
    this.searchQuery = '';
  }

  getList() {
    this.pageLoader = true; this.tempList = [];
    const skip = (this.page - 1) * this.pageSize;
    this.storeApi.BLOG_LIST(skip, this.pageSize).subscribe(result => {
      if(result.status) {
        this.list = result.list;
        this.totalPages = Math.ceil(result.count/this.pageSize);
        for(let i=0; i<result.count; i++) {
          this.tempList.push("");
        }
        // SEO
        this.seo_details = result.seo_details;
        if(this.seo_details.status) this.commonService.setSiteMetaData(this.seo_details, null);
        else this.commonService.getStoreSeoDetails();
        // ItemList schema for blog listing
        this.commonService.removeElement('blogs-itemlist-jsonld');
        const itemListSchema = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Tulsi Silks Journal",
          "url": this.commonService.origin + "/blogs",
          "itemListElement": this.list.map((blog: any, i: number) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": this.commonService.origin + (blog.seo_status && blog.seo_details?.page_url
              ? '/blogs/' + blog.seo_details.page_url
              : '/blogs/' + blog._id),
            "name": blog.name
          }))
        };
        this.commonService.createJsonLD('blogs-itemlist-jsonld', itemListSchema);
      }
      else console.log("response", result);
      setTimeout(() => { this.pageLoader = false; }, 500);
    });
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

  ngOnDestroy() {
    this.commonService.removeElement('blogs-itemlist-jsonld');
  }

  onSelectBlog(x: any) {
    // set page attributes
    this.commonService.blog_page_attr = {
      list: this.list, seo_details: this.seo_details, page: this.page, total_pages: this.totalPages,
      scroll_y_pos: this.commonService.scroll_y_pos, temp_list: this.tempList
    };
  }

}