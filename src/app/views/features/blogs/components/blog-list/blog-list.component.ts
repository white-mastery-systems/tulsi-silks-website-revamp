import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-blog-list',
    templateUrl: './blog-list.component.html',
    styleUrls: ['./blog-list.component.scss'],
    standalone: false
})
export class BlogListComponent {
  /** Full page of blogs from API or mocks */
  @Input() blogs: any[] = [];
  @Input() loading = false;
  @Input() imgBaseUrl = '';
  /** Pagination page — featured hero only on page 1 */
  @Input() page = 1;
  /** Bootstrap container class for grid + pagination (`container` / `container-fluid`) */
  @Input() bodyContainer = 'container';

  @Output() selectBlog = new EventEmitter<any>();

  readonly skeletonSlots = [0, 1, 2, 3, 4, 5];

  emitFeatured(item: any): void {
    if (item) this.selectBlog.emit(item);
  }

  trackById(_: number, item: any): string {
    return item?._id ?? '';
  }

  get showFeatured(): boolean {
    return this.page === 1 && Array.isArray(this.blogs) && this.blogs.length > 0;
  }

  get featuredBlog(): any | null {
    return this.showFeatured ? this.blogs[0] : null;
  }

  get gridBlogs(): any[] {
    if (!Array.isArray(this.blogs) || !this.blogs.length) return [];
    if (this.page === 1 && this.blogs.length > 1) return this.blogs.slice(1);
    if (this.page === 1 && this.blogs.length === 1) return [];
    return this.blogs;
  }

  resolveFeaturedImg(item: any): string {
    if (!item?.image) return '';
    const s = String(item.image);
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

  featuredExcerpt(item: any, max = 220): string {
    const t = this.stripHtml(item?.description);
    if (t.length <= max) return t;
    return t.slice(0, max).trimEnd() + '…';
  }

  routerLinkFeatured(item: any): string[] {
    if (!item) return ['/blogs'];
    if (item.seo_status && item.seo_details?.page_url) return ['/blogs/' + item.seo_details.page_url];
    return ['/blogs/' + item._id];
  }
}
