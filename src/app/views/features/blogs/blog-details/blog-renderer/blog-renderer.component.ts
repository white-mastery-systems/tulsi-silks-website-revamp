import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { createEditorJsCustomParsers } from '../editorjs-custom-parsers';
import { wrapEditorJsArticleSections } from '../editorjs-section-wrap';

/** Mixed article stream: HTML from Editor.js + interactive blocks (e.g. product carousel). */
export type BlogRendererSegment =
  | { kind: 'html'; html: SafeHtml }
  | { kind: 'carousel'; data: Record<string, unknown>; carouselKey: string };

/**
 * Renders Editor.js JSON (`content.blocks`) to sanitized HTML using Tulsi custom parsers.
 * `productCarousel` blocks are spliced out and rendered as `app-blog-product-carousel` (Swiper).
 *
 * Phase 1 perf: `editorjs-html` is lazy-loaded — it is not bundled into initial `main` / blog route chunk eagerly.
 */
@Component({
    selector: 'app-blog-renderer',
    templateUrl: './blog-renderer.component.html',
    styleUrls: ['./blog-renderer.component.scss'],
    standalone: false
})
export class BlogRendererComponent implements OnChanges {
  @Input() blocks: any[] | undefined;
  @Input() imgBaseUrl = '';

  segments: BlogRendererSegment[] = [];

  /** Default export shape of `editorjs-html`. */
  private edjsHtmlDefault: ((plugins?: Record<string, unknown>) => { parse: (data: unknown) => string }) | null = null;
  private edjsHtmlLoadPromise: Promise<(plugins?: Record<string, unknown>) => { parse: (data: unknown) => string }> | null =
    null;

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['blocks'] && !changes['imgBaseUrl']) return;
    void this.buildSegmentsAsync();
  }

  private getEdjsHTML(): Promise<(plugins?: Record<string, unknown>) => { parse: (data: unknown) => string }> {
    if (this.edjsHtmlDefault) {
      return Promise.resolve(this.edjsHtmlDefault);
    }
    if (!this.edjsHtmlLoadPromise) {
      this.edjsHtmlLoadPromise = import('editorjs-html').then((m) => {
        this.edjsHtmlDefault = m.default;
        return m.default;
      });
    }
    return this.edjsHtmlLoadPromise;
  }

  /** Known-safe block types (editorjs-html defaults + Tulsi custom blocks). */
  private readonly safeBlockTypes = new Set<string>([
    // editorjs-html defaults (common tools)
    'paragraph',
    'header',
    'list',
    'quote',
    'delimiter',
    'image',
    'table',
    'embed',
    'code',
    'raw',
    'linkTool',
    'warning',
    'checklist',
    'attaches',
    // Tulsi custom blocks
    'tableOfContents',
    'button',
    'productCta',
    'ctaBlock',
    // fallback wrapper
    'unsupported',
  ]);

  private async buildSegmentsAsync(): Promise<void> {
    const list = this.blocks;
    if (!list?.length) {
      this.segments = [];
      this.cdr.markForCheck();
      return;
    }

    const edjsHTML = await this.getEdjsHTML();
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
        const html = this.renderChunkHtml(chunk, edjsHTML);
        if (html) {
          segments.push({
            kind: 'html',
            html: this.sanitizer.bypassSecurityTrustHtml(html),
          });
        }
      }
    }

    this.segments = segments;
    this.cdr.markForCheck();
  }

  private renderChunkHtml(chunk: any[], edjsHTML: (plugins?: Record<string, unknown>) => { parse: (data: unknown) => string }): string {
    if (!chunk?.length) return '';
    const parser = edjsHTML(createEditorJsCustomParsers(this.imgBaseUrl));

    const tryParse = (blocks: any[]): string => {
      const htmlRaw = parser.parse({ blocks });
      return wrapEditorJsArticleSections(htmlRaw);
    };

    // 1) First attempt: render as-is.
    try {
      const html = tryParse(chunk);
      return html && html.trim() ? html : '';
    } catch {
      // continue to fallback
    }

    // 2) Fallback: keep known-safe blocks, replace unknowns with a hidden placeholder.
    const sanitized: any[] = [];
    const seenUnsupported = new Set<string>();
    for (const b of chunk) {
      const t = b?.type != null ? String(b.type) : '';
      if (!t) continue;
      if (this.safeBlockTypes.has(t)) {
        sanitized.push(b);
      } else {
        // Render a non-breaking placeholder (kept hidden via CSS).
        sanitized.push({ type: 'unsupported', data: { originalType: t } });
        seenUnsupported.add(t);
      }
    }

    try {
      const html = tryParse(sanitized);
      return html && html.trim() ? html : '';
    } catch {
      // 3) Final fallback: render only placeholders (avoid blank page if parser keeps failing).
      const fallbacks = Array.from(seenUnsupported).map((t) => ({
        type: 'unsupported',
        data: { originalType: t },
      }));
      try {
        const html = tryParse(fallbacks);
        return html && html.trim() ? html : '';
      } catch {
        return '';
      }
    }
  }
}
