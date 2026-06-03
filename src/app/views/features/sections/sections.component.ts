import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CommonService } from '../../../services/common.service';
import { StoreApiService } from '../../../services/store-api.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-sections',
    templateUrl: './sections.component.html',
    styleUrls: ['./sections.component.scss'],
    standalone: false
})

export class SectionsComponent implements OnInit, OnDestroy {

  pageLoader = false;
  pageUrl: string | null = null;
  catalogDetails: any = null;
  displayList: any[] = [];
  activePageName = '';
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;

  private routeSub?: Subscription;
  private categoryImageCache: Record<string, string> = {};

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    public commonService: CommonService,
    private storeApi: StoreApiService,
  ) { }

  ngOnInit(): void {
    this.routeSub = this.activeRoute.params.subscribe((params: Params) => {
      this.pageUrl = params['page_url'] || null;
      if (!this.pageUrl) {
        this.router.navigate(['/404']);
        return;
      }
      this.loadCatalogs();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadCatalogs(): void {
    if (this.commonService.catalog_with_sub_list.length) {
      this.applyRoute();
      return;
    }
    this.pageLoader = true;
    this.storeApi.CATALOGS_WITH_SUB_CATALOGS().subscribe(result => {
      if (result.status) {
        this.commonService.catalog_with_sub_list = result.list || [];
        this.applyRoute();
      } else {
        console.log('response', result);
        this.router.navigate(['/404']);
      }
      setTimeout(() => { this.pageLoader = false; }, 300);
    });
  }

  applyRoute(): void {
    const catalog = this.commonService.catalog_with_sub_list.find(
      (item: any) => item.page_url === this.pageUrl,
    );
    if (!catalog) {
      this.router.navigate(['/404']);
      return;
    }
    this.loadSubCatalogs(catalog);
  }

  loadSubCatalogs(catalog: any): void {
    const cached = this.commonService.catalog_sub_details_cache[catalog._id];
    if (cached) {
      this.setSubCatalogView(cached);
      return;
    }

    this.pageLoader = true;
    this.storeApi.SUB_CATALOG_DETAILS(catalog._id).subscribe(result => {
      if (result.status && result.data) {
        this.commonService.catalog_sub_details_cache[catalog._id] = result.data;
        this.setSubCatalogView(result.data);
      } else {
        console.log('response', result);
        this.router.navigate(['/404']);
      }
      setTimeout(() => { this.pageLoader = false; }, 300);
    });
  }

  setSubCatalogView(data: any): void {
    this.catalogDetails = data;
    this.displayList = data.sub_catalogs || [];
    this.activePageName = data.name;
    if (data.seo_details?.page_title) {
      this.commonService.setSiteMetaData(data.seo_details, null);
    } else {
      this.commonService.getStoreSeoDetails();
    }
    this.setBreadcrumb();
    this.enrichDisplayImages();
  }

  enrichDisplayImages(): void {
    if (!this.displayList.length) return;

    const jobs = this.displayList.map((item) => this.enrichItemImage(item));
    forkJoin(jobs).subscribe(() => {
      this.displayList = [...this.displayList];
    });
  }

  enrichItemImage(item: any): Observable<any> {
    const catalogImage = this.lookupCatalogListImage(item);
    if (catalogImage) {
      item.image = catalogImage;
      return of(item);
    }
    if (item.image) return of(item);

    return this.fetchCategoryProductImage(item._id).pipe(
      tap((img) => { if (img) item.image = img; }),
      map(() => item),
    );
  }

  fetchCategoryProductImage(categoryId: string): Observable<string | null> {
    if (this.categoryImageCache[categoryId]) {
      return of(this.categoryImageCache[categoryId]);
    }
    return this.storeApi.RANDOM_PRODUCT_LIST({ category_id: categoryId, limit: 1 }).pipe(
      map((result) => {
        const img = result.status ? result.list?.[0]?.image_list?.[0]?.image : null;
        if (img) this.categoryImageCache[categoryId] = img;
        return img;
      }),
      catchError(() => of(null)),
    );
  }

  lookupCatalogListImage(item: any): string | null {
    const cat = this.commonService.catalog_list?.find((c: any) =>
      c._id === item._id || c.seo_details?.page_url === item.page_url,
    );
    return cat?.image || null;
  }

  setBreadcrumb(): void {
    this.commonService.breadCrumbList([
      { name: 'Home', position: 1, link: '/' },
      { name: this.catalogDetails.name, position: 2, link: this.router.url.split('?')[0] },
    ]);
  }

  onSelectSubCatalog(item: any): void {
    if (item?.url) {
      try {
        const path = new URL(item.url).pathname;
        this.router.navigateByUrl(path);
        return;
      } catch {
        /* fall through */
      }
    }
    if (item?.page_url) {
      this.router.navigate(['/category', item.page_url]);
    }
  }

  itemImage(item: any): string | null {
    const path = item?.image || this.lookupCatalogListImage(item);
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return this.imgBaseUrl + path;
  }

  get pageTitle(): string {
    const h1 = this.catalogDetails?.seo_details?.h1_tag?.trim();
    return h1 || this.activePageName;
  }

}
