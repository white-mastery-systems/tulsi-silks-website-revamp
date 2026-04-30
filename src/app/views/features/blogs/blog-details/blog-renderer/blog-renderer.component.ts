import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import edjsHTML from 'editorjs-html';
import { createEditorJsCustomParsers } from '../editorjs-custom-parsers';
import { wrapEditorJsArticleSections } from '../editorjs-section-wrap';

/** Mixed article stream: HTML from Editor.js + interactive blocks (e.g. product carousel). */
export type BlogRendererSegment =
  | { kind: 'html'; html: SafeHtml }
  | { kind: 'carousel'; data: Record<string, unknown>; carouselKey: string };

/**
 * Renders Editor.js JSON (`content.blocks`) to sanitized HTML using Tulsi custom parsers.
 * `productCarousel` blocks are spliced out and rendered as `app-blog-product-carousel` (Swiper).
 */
@Component({
  selector: 'app-blog-renderer',
  templateUrl: './blog-renderer.component.html',
  styleUrls: ['./blog-renderer.component.scss'],
})
export class BlogRendererComponent implements OnChanges {
  @Input() blocks: any[] | undefined;
  @Input() imgBaseUrl = '';

  segments: BlogRendererSegment[] = [];

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['blocks'] && !changes['imgBaseUrl']) return;
    this.buildSegments();
  }

  private buildSegments(): void {
    const list = this.blocks;
    if (!list?.length) {
      this.segments = [];
      return;
    }

    const segments: BlogRendererSegment[] = [];
    let carouselOrdinal = 0;
    let i = 0;
    const n = list.length;

    while (i < n) {
      const b = list[i];
      if (b?.type === 'productCarousel') {
        const data = b.data;
        const prods = data?.products;
        if (Array.isArray(prods) && prods.length) {
          segments.push({
            kind: 'carousel',
            data,
            carouselKey: `ejpc${carouselOrdinal++}`,
          });
        }
        i++;
      } else {
        const start = i;
        while (i < n && list[i]?.type !== 'productCarousel') {
          i++;
        }
        const chunk = list.slice(start, i);
        if (chunk.length) {
          const parser = edjsHTML(createEditorJsCustomParsers(this.imgBaseUrl));
          const htmlRaw = parser.parse({ blocks: chunk });
          const html = wrapEditorJsArticleSections(htmlRaw);
          if (html && html.trim()) {
            segments.push({
              kind: 'html',
              html: this.sanitizer.bypassSecurityTrustHtml(html),
            });
          }
        }
      }
    }

    this.segments = segments;
  }
}
