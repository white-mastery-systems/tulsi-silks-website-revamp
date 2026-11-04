import {
  categoryRobotsContent,
  faqAnswerPlainText,
  shouldEmitCategoryItemListSchema,
} from './category-api.helpers';

describe('faqAnswerPlainText', () => {
  it('strips HTML for JSON-LD', () => {
    expect(faqAnswerPlainText('<p>Hello <a href="/x">link</a></p>')).toBe('Hello link');
  });
});

describe('categoryRobotsContent (Kanjivaram SEO)', () => {
  const base = {
    page: 1,
    sortValue: 'latest',
    tagList: [],
    priceFiltered: false,
  };

  it('indexes a stocked Kanjivaram hub', () => {
    expect(
      categoryRobotsContent({
        ...base,
        pageUrl: '/category/kanjivaram-silk-sarees',
        productTotal: 327,
      })
    ).toBe('index, follow');
  });

  it('noindexes thin Kanjivaram categories with fewer than 4 products', () => {
    expect(
      categoryRobotsContent({
        ...base,
        pageUrl: '/category/kanjivaram-pattu-silk-sarees',
        productTotal: 2,
      })
    ).toBe('noindex, follow');
  });

  it('noindexes explicit slug list (mood colour pages)', () => {
    expect(
      categoryRobotsContent({
        ...base,
        pageUrl: '/category/trending-colour-kanjivaram-silk-sarees',
        productTotal: 141,
      })
    ).toBe('noindex, follow');
  });

  it('noindexes paginated views', () => {
    expect(
      categoryRobotsContent({
        ...base,
        page: 2,
        pageUrl: '/category/kanjivaram-silk-sarees',
        productTotal: 327,
      })
    ).toBe('noindex, follow');
  });

  it('respects API force noindex flag', () => {
    expect(
      categoryRobotsContent({
        ...base,
        pageUrl: '/category/soft-silk',
        productTotal: 80,
        forceNoindex: true,
      })
    ).toBe('noindex, follow');
  });

  it('does not emit item list schema when noindex', () => {
    expect(
      shouldEmitCategoryItemListSchema({
        ...base,
        pageUrl: '/category/daily-wear-kanjivaram-silk-sarees',
        productTotal: 0,
      })
    ).toBe(false);
  });
});
