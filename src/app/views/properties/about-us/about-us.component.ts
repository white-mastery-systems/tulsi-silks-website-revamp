import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

interface TimelineItem {
  year: number;
  image: string;
  title: string;
  description: string;
}
interface HeritageItem {
  image: string;
  title: string;
  description: string;
}

@Component({
    selector: 'app-about-us',
    templateUrl: './about-us.component.html',
    styleUrls: ['./about-us.component.scss'],
    standalone: false
})

export class AboutUsComponent implements OnInit, AfterViewInit, OnDestroy {

  private static readonly MASTHEAD_FALLBACK_PX = 80;

  fullBleedHeroHeightCss = `calc(100vh - ${AboutUsComponent.MASTHEAD_FALLBACK_PX}px)`;

  get fsHeroHeightStyle(): string | null {
    return this.template_setting?.primary_slider === 'fs_slider' ? this.fullBleedHeroHeightCss : null;
  }

  imgBaseUrl = 'assets/';
  pageLoader: boolean;
  template_setting = environment.template_setting;
  primary_main_slider: any[] = [];
  screen_width: number = 0;
  currentIndex = 0;
  heritageData: HeritageItem[] = [
    {
      image: 'assets/images/scroll-image.png',
      title: 'Handwoven Indian Heritage',
      description: 'Tulsi Silks is committed to preserving India\'s rich textile legacy through exceptional craftsmanship. Every saree is meticulously handwoven by master artisans, combining heritage techniques with uncompromising quality standards. Our attention to detail ensures that each drape is a refined expression of artistry and cultural integrity.'
    },
    {
      image: 'assets/images/img-2.jpg',
      title: 'Classic Meets Contemporary',
      description: 'At Tulsi Silks, tradition is not static—it evolves. Our design philosophy bridges classic techniques with contemporary styling, offering versatile sarees that complement both traditional ceremonies and modern wardrobes. From bridal couture to minimalist silks, each collection is curated with a forward-thinking perspective.'
    },
    {
      image: 'assets/images/img-3.jpg',
      title: 'Cherished Through Generations',
      description: 'Over the decades, Tulsi Silks has become a trusted destination for saree connoisseurs. Our commitment extends beyond the product—delivering a personalised, seamless shopping experience, whether in-store or online. With a focus of authenticity, consistency, and customer care, we build relationships that span generations.'
    }
  ];

  timelineData: TimelineItem[] = [
    {
      year: 1993,
      image: 'assets/images/timeline-1.jpg',
      title: 'Our Story Begins: Draped in Legacy Since 1993',
      description: 'Tulsi Silks was born from the vision of Suresh and Santosh Parekh, who brought their deep expertise in textiles to life. Every saree crafted then and now echoes their unwavering commitment to quality and timeless heritage.'
    },
    {
      year: 2013,
      image: 'assets/images/timeline-2.jpg',
      title: 'A Beautiful Expansion: Growing with Grace and Purpose',
      description: 'In 2013, we moved into a larger, more vibrant space in Mylapore to meet growing love and demand. Yet, our ethos remained the same—celebrating handwoven beauty, personal service, and authentic craftsmanship.'
    },
    {
      year: 2023,
      image: 'assets/images/timeline-3.jpg',
      title: 'A Timeless Saree Legacy: Today, a Symbol of Elegance',
      description: 'With over 30 years of trust, Tulsi Silks is a cherished name for exquisite sarees across generations. From Kanjivaram classics to designer drapes, we continue to weave culture, elegance, and soul into every creation.'
    }
  ];


  constructor(public commonService: CommonService, @Inject(DOCUMENT) private document, @Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.screen_width = window.innerWidth;
      this.loadSliderData();
    }
    // Organization schema
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "ClothingStore",
      "@id": this.commonService.origin + "/#organization",
      "name": "Tulsi Silks",
      "url": this.commonService.origin,
      "foundingDate": "1993",
      "founder": [
        { "@type": "Person", "name": "Suresh Parekh" },
        { "@type": "Person", "name": "Santosh Parekh" }
      ],
      "description": "Tulsi Silks is a premier saree retailer established in 1993, specialising in handwoven Kanjivaram and traditional Indian silk sarees, based in Mylapore, Chennai.",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "68, Luz Church Rd, CIT Colony, Mylapore",
        "addressLocality": "Chennai",
        "addressRegion": "Tamil Nadu",
        "postalCode": "600004",
        "addressCountry": "IN"
      },
      "sameAs": [
        "https://www.facebook.com/TulsiSilks/",
        "https://x.com/tulsisilks",
        "https://www.instagram.com/tulsisilks/?hl=en",
        "https://in.pinterest.com/tulsisilks0070/"
      ]
    };
    this.commonService.createJsonLD('about-org-jsonld', orgSchema);
    // Breadcrumb
    this.commonService.breadCrumbList([
      { name: 'Home', position: 1, link: '/' },
      { name: 'About Us', position: 2, link: '/about-us' }
    ]);
  }

  ngOnDestroy(): void {
    this.commonService.removeElement('about-org-jsonld');
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setSliderHeight();
    }
  }

  next(): void {
    if (this.currentIndex < this.timelineData.length - 1) {
      this.currentIndex++;
    }
  }

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  loadSliderData(): void {
    this.primary_main_slider = [
      {
        mobile_img: 'images/banner-mob.png',
        desktop_img: 'images/about-des-slider1.png',
        img_alt: 'Elegant Saree',
        position: 'm_c',
        content_status: true,
        content_details: {
          heading: 'Elegant Sarees Collection',
          sub_heading: 'Unveil the beauty of tradition',
          text_color: 'light'
        },
        btn_status: true,
        btn_text: 'Explore Now',
        btn_link: '/products/sarees'
      },
      // {
      //   mobile_img: 'slider2-mobile.jpg',
      //   desktop_img: 'images/about-des-slider1.png',
      //   img_alt: 'Classic Weaves',
      //   position: 'm_r',
      //   content_status: true,
      //   content_details: {
      //     heading: 'Handpicked Classics',
      //     sub_heading: 'Crafted with elegance and grace',
      //     text_color: 'dark'
      //   },
      //   btn_status: true,
      //   btn_text: 'Shop Now',
      //   btn_link: '/products/classics'
      // },
      // {
      //   mobile_img: 'slider3-mobile.jpg',
      //   desktop_img: 'images/about-des-slider1.png',
      //   img_alt: 'Festive Styles',
      //   position: 't_c',
      //   content_status: true,
      //   content_details: {
      //     heading: 'Celebrate the Season',
      //     sub_heading: 'Festive collections for every occasion',
      //     text_color: 'light'
      //   },
      //   btn_status: true,
      //   btn_text: 'View Collection',
      //   btn_link: '/products/festive'
      // }
    ];
  }

  getDotLeftPosition(index: number): number {
  const count = this.timelineData.length - 1;
  return (index / count) * 100;
}

  onPageRedirect(slide: any): void {
    // You can customize this with router navigation
    if (isPlatformBrowser(this.platformId)) {
      if (slide.btn_link) {
        window.location.href = slide.btn_link;
      }
    }
  }

  setSliderHeight() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (environment.template_setting.primary_slider !== 'fs_slider') return;
    const raw = this.document.getElementById('headroom-head')?.offsetHeight;
    const n = Number(
      typeof raw === 'number' && !Number.isNaN(raw) ? raw : AboutUsComponent.MASTHEAD_FALLBACK_PX
    );
    const mastHeight = Number.isFinite(n) && n >= 0 ? Math.trunc(n) : AboutUsComponent.MASTHEAD_FALLBACK_PX;
    this.fullBleedHeroHeightCss = `calc(100vh - ${mastHeight}px)`;
    this.document.body.style.marginTop = `${mastHeight}px`;
  }

}
