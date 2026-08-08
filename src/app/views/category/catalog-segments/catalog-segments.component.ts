import { Component, Input, OnInit, OnChanges, SimpleChanges, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonService } from '../../../services/common.service';
import { StoreApiService } from '../../../services/store-api.service';
import { CatalogPageSegment } from '../category-api.types';

@Component({
  selector: 'app-catalog-segments',
  templateUrl: './catalog-segments.component.html',
  styleUrls: ['./catalog-segments.component.scss'],
  standalone: false
})
export class CatalogSegmentsComponent implements OnInit, OnChanges {

  @Input() segments: CatalogPageSegment[] = [];
  @Input() blogList: any[] = [];

  imgBaseUrl = environment.img_baseurl;
  template_setting: any = environment.template_setting;

  segmentBlogList: any[] = [];

  constructor(
    public commonService: CommonService,
    private storeApi: StoreApiService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['blogList']?.currentValue?.length) {
      this.segmentBlogList = changes['blogList'].currentValue;
    }
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.blogList?.length) {
      this.segmentBlogList = this.blogList;
      return;
    }
    if (!this.segments?.some(s => s.type === 'blogs' && s.active_status !== false)) return;
    if (this.commonService.ys_features?.indexOf('blogs') === -1) return;
    this.storeApi.HOME_PAGE_BLOG_LIST(4).subscribe(result => {
      if (result.status) this.segmentBlogList = (result.list || []).slice(0, 4);
    });
  }

  activeSegments(): CatalogPageSegment[] {
    return (this.segments || [])
      .filter(s => s.active_status !== false)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }

  segmentBtnLink(item: any): string | null {
    const linkType = item?.btn_link_type || item?.link_type;
    const link = item?.btn_link || item?.link;
    if (!link || linkType !== 'internal') return null;
    return link.startsWith('/') || link.startsWith('http') ? link : '/' + link;
  }

  onSegmentBtnClick(item: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const linkType = item?.btn_link_type || item?.link_type;
    const link = item?.btn_link || item?.link;
    if (linkType === 'internal' && link) {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        if (isPlatformBrowser(this.platformId)) window.open(link, '_self');
        return;
      }
      const path = link.startsWith('/') ? link : '/' + link;
      this.router.navigateByUrl(path);
      return;
    }
    this.commonService.onPageRedirect({
      link_status: true,
      link_type: linkType,
      link,
      category_id: item?.category_id,
      product_id: item?.product_id
    });
  }

  hasIconCardCta(segment: CatalogPageSegment): boolean {
    return (segment.icon_card_list || []).some(card => card.btn_status && card.btn_text);
  }

  segmentImageSrc(img: { desktop_img?: string; mobile_img?: string }): string {
    const path = (!this.commonService.desktop_device && img.mobile_img) ? img.mobile_img : img.desktop_img;
    return path ? this.imgBaseUrl + path : '';
  }

  segmentIconName(name?: string): string {
    if (!name) return '';
    if (name === 'alendar-heart') return 'calendar-heart';
    return name;
  }

  catalogCtaButtons(segment: CatalogPageSegment): any[] {
    const buttons: any[] = [];
    for (const cta of segment.cta_list || []) {
      if (cta.btn_status && cta.btn_text) buttons.push(cta);
      for (const sub of cta.btn_list || []) {
        if (sub.btn_status !== false && sub.btn_text) buttons.push(sub);
      }
    }
    return buttons;
  }

  groupLinks(group: any): any[] {
    return (group?.link_list || []).filter((link: any) => link.btn_status !== false && link.btn_text);
  }

  internalLinksColumns(links: any[], columnCount = 3): any[][] {
    const items = links || [];
    if (!items.length) return [];
    const perCol = Math.ceil(items.length / columnCount);
    const columns: any[][] = [];
    for (let i = 0; i < columnCount; i++) {
      const chunk = items.slice(i * perCol, (i + 1) * perCol);
      if (chunk.length) columns.push(chunk);
    }
    return columns;
  }

  trackSegmentLink(index: number, link: any): string {
    return `${link?.link || link?.btn_text || index}`;
  }

  secondaryFeaturesLayout(features: any[]): 'grid' | 'stack' {
    return features?.length === 4 ? 'grid' : 'stack';
  }
}
