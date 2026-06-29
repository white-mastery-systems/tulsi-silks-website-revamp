import { Component, Input } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommonService } from '../../../services/common.service';
import { CatalogPageSegment } from '../category-api.types';

@Component({
  selector: 'app-catalog-segments',
  templateUrl: './catalog-segments.component.html',
  styleUrls: ['./catalog-segments.component.scss'],
  standalone: false
})
export class CatalogSegmentsComponent {

  @Input() segments: CatalogPageSegment[] = [];

  imgBaseUrl = environment.img_baseurl;
  template_setting: any = environment.template_setting;

  constructor(public commonService: CommonService) {}

  activeSegments(): CatalogPageSegment[] {
    return (this.segments || [])
      .filter(s => s.active_status !== false)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }

  segmentBtnLink(item: any): string | null {
    if (!item?.btn_link || item.btn_link_type !== 'internal') return null;
    return item.btn_link;
  }

  onSegmentBtnClick(item: any, event: Event) {
    if (item?.btn_link_type === 'internal' && item?.btn_link) return;
    event.preventDefault();
    this.commonService.onPageRedirect(item);
  }
}
