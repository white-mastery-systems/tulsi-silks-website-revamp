import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class SwiperService {

  highlights: any = {
    card_count: 6,
    auto_play: true,
    loop:true,
    break_points: {
      1024: { slidesPerView: 7.5, spaceBetween: 0 },
      768: { slidesPerView: 4.5, spaceBetween: 0 },
      640: { slidesPerView: 3.5, spaceBetween: 0 },
      320: { slidesPerView: 3.5, spaceBetween: 0 }
    }
  };

  featured_section: any = {
    card_count: 4,
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };

  featured_products: any = {
    card_count: 4,
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };

  multi_tab_featured_products: any = {
    card_count: 4,
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };

  testimonial: any = {
    card_count: 4,
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };
  
  blogs: any = {
    card_count: 4,
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };

  shop_look: any = {
    card_count: 4,
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };

  related_products: any = {
    card_count: 4,
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };

  instagram: any = {
    card_count: 4,
    auto_play: true,
    break_points: {
      1024: { slidesPerView: 4, spaceBetween: 0 },
      768: { slidesPerView: 3, spaceBetween: 0 },
      640: { slidesPerView: 2, spaceBetween: 0 },
      320: { slidesPerView: 1, spaceBetween: 0 }
    }
  };

  constructor() { }

}