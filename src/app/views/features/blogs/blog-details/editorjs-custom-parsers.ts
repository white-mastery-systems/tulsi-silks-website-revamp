/**
 * Custom Editor.js → HTML parsers for editorjs-html (non-standard block types + table + anchored headers).
 */

function escapeHtml(s: string): string {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveMediaUrl(path: string, imgBaseUrl: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.replace(/^\/+/, '');
  return imgBaseUrl + p;
}

/** `/product/:segment` segment — matches Angular product route + `PRODUCT_DETAILS({ product_id })`. */
function extractProductPathSegment(ctaUrl: string): string {
  const s = String(ctaUrl ?? '').trim();
  if (!s || s === '#') return '';
  const m = s.match(/\/product\/([^/?#]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]) : '';
}

/** Relative CMS paths → site-root paths (same rule as product CTA). */
function resolveBlogCtaHref(href: string): string {
  const s = String(href ?? '').trim();
  if (!s || s === '#') return '#';
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith('/') ? s : '/' + s.replace(/^\/+/, '');
}

/** Valid fragment id (letters, digits, -, _). Leading digit prefixed. */
function sanitizeHtmlId(raw: string): string {
  let s = raw.replace(/^#/, '').trim();
  if (!s) return '';
  s = s
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  if (/^[0-9]/.test(s)) {
    s = `id-${s}`;
  }
  return s;
}

function slugFromHeadingTitle(text: unknown): string {
  if (text == null || text === '') return '';
  const t = String(text).trim().toLowerCase().replace(/\s+/g, '-');
  return sanitizeHtmlId(t);
}

function slugFromAnchorField(value: unknown): string {
  if (value == null || String(value).trim() === '') return '';
  return sanitizeHtmlId(String(value));
}

/** Pass as first argument to editorjs-html: edjsHTML({ ...createEditorJsCustomParsers(imgBaseUrl) }) */
export function createEditorJsCustomParsers(imgBaseUrl: string): Record<string, (block: { data: any }) => string> {
  const allocatedIds = new Set<string>();

  function allocateUniqueHeadingId(preferred: string, level: number, ordinal: number): string {
    let base = sanitizeHtmlId(preferred);
    if (!base) {
      base = level === 3 ? `ej-sub-${ordinal}` : level >= 4 ? `ej-h${level}-${ordinal}` : `ej-sec-${ordinal}`;
    }
    let id = base;
    let n = 0;
    while (allocatedIds.has(id)) {
      n++;
      id = `${base}-${n}`;
    }
    allocatedIds.add(id);
    return id;
  }

  let headingOrdinal = 0;

  return {
    header: ({ data }) => {
      headingOrdinal++;
      const level = Math.min(Math.max(Number(data.level) || 2, 1), 6);
      const anchorSlug = slugFromAnchorField(data.anchor);
      const titleSlug = slugFromHeadingTitle(data.text);
      const preferred = anchorSlug || titleSlug;
      const headingId = allocateUniqueHeadingId(preferred, level, headingOrdinal);
      const idAttr = ` id="${escapeHtml(headingId)}"`;
      const text = data.text != null ? String(data.text) : '';
      return `<h${level}${idAttr}>${text}</h${level}>`;
    },

    image: ({ data }) => {
      const raw = data?.file?.url ?? data?.file?.path ?? data?.url ?? '';
      const src = resolveMediaUrl(raw, imgBaseUrl);
      const captionTrimmed =
        data?.caption != null && String(data.caption).trim() !== ''
          ? String(data.caption).trim()
          : '';
      const altText = captionTrimmed || '';
      const figcaptionHtml = captionTrimmed
        ? `<figcaption class="ej-figure__caption">${escapeHtml(captionTrimmed)}</figcaption>`
        : '';
      return (
        `<figure class="ej-figure">` +
        `<img src="${escapeHtml(src)}" alt="${escapeHtml(altText)}" loading="lazy" decoding="async" />` +
        `${figcaptionHtml}` +
        `</figure>`
      );
    },

    table: ({ data }) => {
      const rows: string[][] = data.content || [];
      if (!rows.length) return '';
      const withHeadings = !!(data.withHeadings && rows[0]?.length);
      const tableClass = withHeadings
        ? 'ej-table ej-table--has-th'
        : 'ej-table ej-table--no-th';
      let html = `<div class="ej-table-card ej-table-card--premium"><table class="${tableClass}">`;
      if (withHeadings) {
        html += '<thead><tr>';
        rows[0].forEach((cell) => {
          html += `<th>${escapeHtml(String(cell))}</th>`;
        });
        html += '</tr></thead><tbody>';
        for (let i = 1; i < rows.length; i++) {
          html += '<tr>';
          rows[i].forEach((cell) => {
            html += `<td>${escapeHtml(String(cell))}</td>`;
          });
          html += '</tr>';
        }
        html += '</tbody>';
      } else {
        html += '<tbody>';
        rows.forEach((row) => {
          html += '<tr>';
          row.forEach((cell, cellIndex) => {
            const cellClass = cellIndex === 0 ? ' class="ej-table__label"' : '';
            html += `<td${cellClass}>${escapeHtml(String(cell))}</td>`;
          });
          html += '</tr>';
        });
        html += '</tbody>';
      }
      html += '</table></div>';
      return html;
    },

    list: ({ data }) => {
      const ordered = data.style === 'ordered';
      const tag = ordered ? 'ol' : 'ul';
      const items: unknown[] = Array.isArray(data.items) ? data.items : [];
      let html = `<${tag}>`;
      items.forEach((item) => {
        html += `<li>${escapeHtml(String(item))}</li>`;
      });
      html += `</${tag}>`;
      return html;
    },

    tableOfContents: ({ data }) => {
      const label = data.label ? String(data.label) : 'Table of contents';
      const items = Array.isArray(data.items) ? data.items : [];
      let html =
        `<details id="ej-toc" class="ej-toc ej-toc--accordion" aria-label="${escapeHtml(label)}">` +
        `<summary class="ej-toc__summary">` +
        `<span class="ej-toc__summary-title">${escapeHtml(label)}</span>` +
        `<span class="ej-toc__chevron" aria-hidden="true"></span>` +
        `</summary>` +
        `<div class="ej-toc__panel">` +
        `<p class="ej-toc__jump-label">Jump to</p>` +
        `<ol class="ej-toc-list">`;

      items.forEach((item: { number?: string; text?: string; anchor?: string }) => {
        const raw = item.anchor != null ? String(item.anchor).trim() : '';
        const frag = sanitizeHtmlId(raw.replace(/^#/, ''));
        const anchor = frag ? `#${frag}` : '';
        const num = item.number != null ? String(item.number) : '';
        const text = item.text != null ? String(item.text) : '';
        const innerRow =
          `<span class="ej-toc-num">${escapeHtml(num)}</span>` +
          `<span class="ej-toc-text">${escapeHtml(text)}</span>`;

        if (!anchor) {
          html += `<li class="ej-toc-item ej-toc-item--static"><span class="ej-toc-row">${innerRow}</span></li>`;
        } else {
          html +=
            `<li class="ej-toc-item">` +
            `<a class="ej-toc-link" href="${escapeHtml(anchor)}">${innerRow}</a>` +
            `</li>`;
        }
      });

      html += '</ol></div></details>';
      return html;
    },

    button: ({ data }) => {
      const alignClass =
        data.alignment === 'left'
          ? 'ej-btn-wrap--left'
          : data.alignment === 'right'
            ? 'ej-btn-wrap--right'
            : 'ej-btn-wrap--center';
      const styleClass =
        data.style === 'dark' ? 'ej-btn ej-btn-dark' : data.style === 'light' ? 'ej-btn ej-btn-light' : 'ej-btn ej-btn-outline';
      const url = data.url ? String(data.url) : '#';
      const label = data.label != null ? String(data.label) : '';
      return `<div class="ej-btn-wrap ${alignClass}"><a class="${styleClass}" href="${escapeHtml(url)}">${escapeHtml(label)}</a></div>`;
    },

    productCta: ({ data }) => {
      const imgRaw = data.productImage ? String(data.productImage) : '';
      const imgSrc = resolveMediaUrl(imgRaw, imgBaseUrl);
      const name = data.productName != null ? String(data.productName) : '';
      const sectionLabel = data.sectionLabel != null ? String(data.sectionLabel) : '';
      const sectionSubtext = data.sectionSubtext != null ? String(data.sectionSubtext) : '';
      const brandRaw =
        data.productBrand != null
          ? String(data.productBrand)
          : data.brand != null
            ? String(data.brand)
            : '';
      const brand = brandRaw.trim();
      const orig = data.originalPrice != null ? String(data.originalPrice) : '';
      const sale = data.salePrice != null ? String(data.salePrice) : '';
      const ctaLabel = data.ctaLabel != null ? String(data.ctaLabel) : '';
      const ctaUrl = data.ctaUrl ? String(data.ctaUrl) : '#';
      const urlResolved =
        ctaUrl.startsWith('http') || ctaUrl.startsWith('/') ? ctaUrl : '/' + ctaUrl.replace(/^\/+/, '');
      const explicitId =
        data.productId != null
          ? String(data.productId).trim()
          : data.product_id != null
            ? String(data.product_id).trim()
            : '';
      /** Prefer explicit Mongo/API id; else same segment as `ctaUrl` (e.g. `/product/TS-001` → `TS-001`). */
      const productIdRaw = explicitId || extractProductPathSegment(urlResolved);
      const productIdAttr =
        productIdRaw !== '' ? ` data-product-id="${escapeHtml(productIdRaw)}"` : '';
      return (
        `<section class="ej-product-cta">` +
        `<div class="ej-product-cta-shell">` +
        `<header class="ej-product-cta-head">` +
        (sectionLabel ? `<p class="ej-product-cta-label">${escapeHtml(sectionLabel)}</p>` : '') +
        (sectionSubtext ? `<p class="ej-product-cta-sub">${escapeHtml(sectionSubtext)}</p>` : '') +
        `</header>` +
        `<div class="ej-product-cta-card">` +
        `<img class="ej-product-cta-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async" />` +
        `<div class="ej-product-cta-info">` +
        (brand ? `<p class="ej-product-cta-brand">${escapeHtml(brand)}</p>` : '') +
        `<div class="ej-product-cta-name">${escapeHtml(name)}</div>` +
        `<div class="ej-product-cta-prices">` +
        (orig ? `<span class="ej-price-orig">${escapeHtml(orig)}</span>` : '') +
        (sale ? `<span class="ej-price-sale">${escapeHtml(sale)}</span>` : '') +
        `</div>` +
        `<a class="primary-btn ej-product-cta-btn" href="${escapeHtml(urlResolved)}"${productIdAttr}>${escapeHtml(ctaLabel)}</a>` +
        `</div></div></div></section>`
      );
    },

    ctaBlock: ({ data }) => {
      const text = data?.text != null ? String(data.text) : '';
      const primary = data?.primaryButton ?? {};
      const secondary = data?.secondaryButton ?? {};
      const pLabel = primary.label != null ? String(primary.label) : '';
      const pHref = resolveBlogCtaHref(primary.link != null ? String(primary.link) : '');
      const sLabel = secondary.label != null ? String(secondary.label) : '';
      const sHref = resolveBlogCtaHref(secondary.link != null ? String(secondary.link) : '');
      const textHtml = text
        ? `<p class="ej-cta-block__text">${escapeHtml(text)}</p>`
        : '';
      const primaryHtml = pLabel
        ? `<a class="primary-btn ej-cta-block__link" href="${escapeHtml(pHref)}">${escapeHtml(pLabel)}</a>`
        : '';
      const secondaryHtml = sLabel
        ? `<a class="secondary-btn ej-cta-block__link" href="${escapeHtml(sHref)}">${escapeHtml(sLabel)}</a>`
        : '';
      const actionsInner = [primaryHtml, secondaryHtml].filter(Boolean).join('');
      const actionsHtml = actionsInner
        ? `<div class="ej-cta-block__actions">${actionsInner}</div>`
        : '';
      if (!textHtml && !actionsHtml) return '';
      return (
        `<section class="ej-cta-block" aria-label="${escapeHtml(pLabel || 'Call to action')}">` +
        `${textHtml}${actionsHtml}` +
        `</section>`
      );
    },

    /** Fallback for unsupported EditorJS block types (kept hidden; prevents renderer crashes). */
    unsupported: ({ data }) => {
      const t = data?.originalType != null ? String(data.originalType) : '';
      const msg = t ? `Unsupported block: ${t}` : 'Unsupported block';
      return `<div class="ej-unsupported" aria-hidden="true">${escapeHtml(msg)}</div>`;
    },
  };
}
