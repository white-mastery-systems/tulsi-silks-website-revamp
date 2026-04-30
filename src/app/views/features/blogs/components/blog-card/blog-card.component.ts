import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-blog-card',
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.scss'],
})
export class BlogCardComponent {
  @Input() item: any;
  /** CDN / API host prefix for relative paths */
  @Input() imgBaseUrl = '';
  @Output() selectBlog = new EventEmitter<any>();

  emitNavigate(): void {
    if (this.item) this.selectBlog.emit(this.item);
  }

  resolveImageSrc(): string {
    const img = this.item?.image;
    if (!img) return '';
    const s = String(img);
    if (/^https?:\/\//i.test(s)) return s;
    return this.imgBaseUrl + s.replace(/^\/+/, '');
  }

  stripHtml(html: unknown): string {
    if (html == null) return '';
    return String(html)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  excerptPreview(maxLen = 160): string {
    const t = this.stripHtml(this.item?.description);
    if (t.length <= maxLen) return t;
    return t.slice(0, maxLen).trimEnd() + '…';
  }

  routerLinkArray(): string[] {
    const x = this.item;
    if (!x) return ['/blogs'];
    if (x.seo_status && x.seo_details?.page_url) return ['/blogs/' + x.seo_details.page_url];
    return ['/blogs/' + x._id];
  }
}
