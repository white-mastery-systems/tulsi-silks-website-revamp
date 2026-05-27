export const environment = {
  production: false,
  header_root: 'header', // header (or) sc-header
  header_type: 'type-5',
  footer: 'light', // dark or light
  store_id: "5d30013a5c83a702392c4c8b",
  ws_url: 'https://yourstore.io/api',
  img_baseurl: 'https://yourstore.io/api/',
  img_host: "https://yourstore.io", // for _s split
  gtag_tracking: false,
  facebook_pixel: false,
  gtag_conversion_id: "",
  razorpay_payment_url: "https://api.razorpay.com/v1/checkout/embedded",
  razorpay_redirect_url: "https://yourstore.io/api/store_details/razorpay_payment/",
  ccavenue_payment_url: "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction",
  ccavenue_redirect_url: "https://yourstore.io/api/store_details/ccavenue_payment/success/",
  ccavenue_cancel_url: "https://yourstore.io/api/store_details/ccavenue_payment/failure/",
  template_setting: {
    header_type: "container-fluid",
    body_type: "container",
    primary_slider: "fs_slider", // fs_slider, slider, ''
    highlights: false,
    products_per_page: 24,
    display_products_count: true,
    currency_format: '1.0',
    qty_scale: true, // - qty +(product page)
    enable_product_inc: true, // for allow to order single qty of each product only(cart page)
    display_estimated_delivery_time: false,
    display_unit: true,
    product_swiper: false,
    display_goback: true,
    breadcrumb: true,
    enable_buynow: true,
    social_share: true,
    related_products_limit: 10,
    blog_count: 10,
    price_range: true,
    category_grid_options: false,
    purchase_badge: false,
    purchase_txt: false,
    p_card: true,
    mat_icon_type: 'icon' // 'icon' (or) 'icon-outline'
  },
  cod_sms: {
    valid_in_seconds: 60,
    interval_in_mins: 60,
    limit: 3
  },
  port: 4006,
  domain: "tulsisilks.co.in",

  /**
   * When true: inject demo Editor.js blocks only if the API response has no `content.blocks`
   * (empty CMS body). Leave false when CMS always returns real payloads.
   */
  mergeEditorJsStaticDemo: false,
  /**
   * Overlay static Editor.js sample only for these blog `_id` values from `/blogs/:blog_id` (Network tab → blog payload `_id`).
   */
  editorJsStaticDemoBlogIds: [] as string[],

  /**
   * Same-origin hero WebP baked into `src/assets/perf/` (no CMS/API upload needed).
   * Use a path starting with `/` (e.g. `/assets/perf/mobile_primary_slider.webp`).
   * Must match `<link rel="preload">` and `#pre-bg` `<picture>` in `src/index.html`.
   * Set to `null` to use CMS `uploads/<store_id>/layouts/mobile_primary_slider.webp` again.
   */
  staticMobileHeroWebpUrl: '/assets/perf/mobile_primary_slider.webp',
};