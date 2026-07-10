import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { createEditorJsCustomParsers } from '../editorjs-custom-parsers';
import { wrapEditorJsArticleSections } from '../editorjs-section-wrap';

/** Mixed article stream: HTML from Editor.js + interactive blocks (e.g. product carousel / list). */
export type BlogRendererSegment =
  | { kind: 'html'; html: SafeHtml }
  | { kind: 'carousel'; data: Record<string, unknown>; carouselKey: string; blockType: string };

/**
 * Renders Editor.js JSON (`content.blocks`) to sanitized HTML using Tulsi custom parsers.
 * `productCarousel` / `productList` blocks are spliced out and rendered as `app-blog-product-carousel`.
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
      if (b?.type === 'productCarousel' || b?.type === 'productList') {
        const data = b.data;
        const prods = data?.products;
        if (Array.isArray(prods) && prods.length) {
          segments.push({
            kind: 'carousel',
            data,
            carouselKey: `ejpc${carouselOrdinal++}`,
            blockType: String(b.type),
          });
        }
        i++;
      } else {
        const start = i;
        while (i < n && list[i]?.type !== 'productCarousel' && list[i]?.type !== 'productList') {
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
      return this.decorateEjTables(
        this.normalizeRenderedHtml(wrapEditorJsArticleSections(htmlRaw))
      );
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

  /**
   * Normalize CMS quirks in rendered Editor.js HTML:
   * - literal `&nbsp;` / NBSP → normal spaces
   * - absolute tulsisilks.co.in links → relative paths for SPA
   */
  private normalizeRenderedHtml(html: string): string {
    if (!html) return html;
    let s = html
      .replace(/&amp;nbsp;/gi, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\u00a0/g, ' ')
      // Fix double-encoded ampersands from CMS table cells
      .replace(/&amp;amp;/gi, '&amp;');

    if (s.indexOf('<a') === -1) return s;

    return s.replace(/<a\b([^>]*)>/gi, (full, attrs: string) => {
      const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
      if (!hrefMatch) return full;
      const quote = hrefMatch[1];
      const href = hrefMatch[2];
      const originMatch = href.match(
        /^https?:\/\/(?:www\.)?tulsisilks\.co\.in(\/[^?#]*)(\?[^#]*)?(#.*)?$/i
      );
      if (!originMatch) return full;
      const nextHref =
        (originMatch[1] || '/') + (originMatch[2] || '') + (originMatch[3] || '');
      let nextAttrs = attrs.replace(
        /\bhref\s*=\s*(["']).*?\1/i,
        `href=${quote}${nextHref}${quote}`
      );
      nextAttrs = nextAttrs.replace(/\s*target\s*=\s*(["'])_blank\1/i, '');
      return `<a${nextAttrs}>`;
    });
  }

  /**
   * Ensure editorial tables get predictable classes for header styling:
   * - with <th>: mark table as `ej-table--has-th`
   * - without <th>: mark `ej-table--no-th` and first cell as `ej-table__label`
   */
  private decorateEjTables(html: string): string {
    if (!html || html.indexOf('ej-table') === -1) return html;
    return html.replace(
      /<table\b([^>]*)class=(["'])([^"']*)\2([^>]*)>([\s\S]*?)<\/table>/gi,
      (_full, before: string, _q: string, classList: string, after: string, inner: string) => {
        const classes = new Set(
          String(classList)
            .split(/\s+/)
            .map((c) => c.trim())
            .filter(Boolean)
        );
        if (!classes.has('ej-table')) {
          return `<table${before}class="${classList}"${after}>${inner}</table>`;
        }

        const hasTh = /<th\b/i.test(inner);
        classes.delete('ej-table--has-th');
        classes.delete('ej-table--no-th');
        classes.add(hasTh ? 'ej-table--has-th' : 'ej-table--no-th');

        let nextInner = inner;
        if (!hasTh) {
          // Mark first cell of each row as the label/heading cell.
          nextInner = nextInner.replace(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi, (rowFull, rowAttrs: string, rowInner: string) => {
            let firstCellDone = false;
            const updatedRowInner = rowInner.replace(
              /<(td)(\b[^>]*)>/gi,
              (cellOpen: string, tag: string, attrs: string) => {
                if (firstCellDone) return cellOpen;
                firstCellDone = true;
                if (/\bclass\s*=/.test(attrs)) {
                  return `<${tag}${attrs.replace(
                    /class=(["'])([^"']*)\1/i,
                    (_m, cq: string, existing: string) => {
                      const next = existing.includes('ej-table__label')
                        ? existing
                        : `${existing} ej-table__label`.trim();
                      return `class=${cq}${next}${cq}`;
                    }
                  )}>`;
                }
                return `<${tag} class="ej-table__label"${attrs}>`;
              }
            );
            return `<tr${rowAttrs}>${updatedRowInner}</tr>`;
          });
        }

        return `<table${before}class="${Array.from(classes).join(' ')}"${after}>${nextInner}</table>`;
      }
    );
  }
}
