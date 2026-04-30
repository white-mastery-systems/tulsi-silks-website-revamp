/**
 * Moves fragment targets from headings onto wrapping `<section>` elements so TOC / URL hashes
 * scroll an entire block (heading + body). Requires headings to expose ids during parsing first.
 */
export function wrapEditorJsArticleSections(html: string): string {
  if (!html || typeof DOMParser === 'undefined') {
    return html;
  }

  const doc = new DOMParser().parseFromString(`<div class="ej-article-root">${html}</div>`, 'text/html');
  const root = doc.body.querySelector('.ej-article-root');
  if (!root) {
    return html;
  }

  wrapLevel2Sections(doc, root);
  root.querySelectorAll('.ej-section--level-2').forEach((sec) => {
    wrapLevel3Subsections(doc, sec as HTMLElement);
  });

  return root.innerHTML;
}

function wrapLevel2Sections(doc: Document, root: Element): void {
  let node = root.firstElementChild;
  while (node) {
    const tag = node.tagName.toLowerCase();
    if (tag === 'h2' && node.id) {
      const secId = node.id;
      const section = doc.createElement('section');
      section.className = 'ej-section ej-section--level-2';
      section.id = secId;
      section.setAttribute('aria-labelledby', `${secId}-title`);

      const titleId = `${secId}-title`;
      node.removeAttribute('id');
      node.id = titleId;

      root.insertBefore(section, node);
      section.appendChild(node);

      let next = section.nextElementSibling;
      while (next && next.tagName.toLowerCase() !== 'h2') {
        const move = next;
        next = next.nextElementSibling;
        section.appendChild(move);
      }
      node = section.nextElementSibling;
    } else {
      node = node.nextElementSibling;
    }
  }
}

function wrapLevel3Subsections(doc: Document, parentSection: HTMLElement): void {
  let node = parentSection.firstElementChild;
  while (node) {
    const tag = node.tagName.toLowerCase();
    if (tag === 'h3' && node.id) {
      const secId = node.id;
      const sub = doc.createElement('section');
      sub.className = 'ej-section ej-section--level-3 ej-subsection';
      sub.id = secId;
      sub.setAttribute('aria-labelledby', `${secId}-title`);

      const titleId = `${secId}-title`;
      node.removeAttribute('id');
      node.id = titleId;

      parentSection.insertBefore(sub, node);
      sub.appendChild(node);

      let next = sub.nextElementSibling;
      while (
        next &&
        next.tagName.toLowerCase() !== 'h3' &&
        next.tagName.toLowerCase() !== 'h2'
      ) {
        const move = next;
        next = next.nextElementSibling;
        sub.appendChild(move);
      }
      node = sub.nextElementSibling;
    } else {
      node = node.nextElementSibling;
    }
  }
}
