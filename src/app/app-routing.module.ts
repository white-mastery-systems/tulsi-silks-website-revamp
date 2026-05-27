import { NgModule } from '@angular/core';
import { NoPreloading, Routes, RouterModule } from '@angular/router';

import { GuestGuard } from './guards/guest.guard';
import { AccountGuard } from './guards/account.guard';

import { MainHeaderComponent } from './shared/components/headers/main-header/main-header.component';

const mainRoutes: Routes = [
  { path: '', loadChildren: () => import('./views/home/home.module').then(m => m.HomeModule) },

  { path: 'search', loadChildren: () => import('./views/search/search.module').then(m => m.SearchModule), data: { preload: false } },
  { path: 'account', loadChildren: () => import('./views/account/account.module').then(m => m.AccountModule) },
  { path: 'guest-login', loadChildren: () => import('./views/guest-login/guest-login.module').then(m => m.GuestLoginModule), canActivate: [GuestGuard] },
  { path: 'wishlist', loadChildren: () => import('./views/wish-list/wish-list.module').then(m => m.WishListModule) },
  { path: 'cart', loadChildren: () => import('./views/cart/cart.module').then(m => m.CartModule) },
  { path: 'web-stories', loadChildren: () => import('./views/stories/stories.module').then(m => m.StoriesModule) },
  { path: 'category', loadChildren: () => import('./views/category/category.module').then(m => m.CategoryModule) },
  { path: 'recommended-products', loadChildren: () => import('./views/category/category.module').then(m => m.CategoryModule) },
  { path: 'on-sale', loadChildren: () => import('./views/category/category.module').then(m => m.CategoryModule) },
  { path: 'featured-products', loadChildren: () => import('./views/category/category.module').then(m => m.CategoryModule) },
  { path: 'best-sellers', loadChildren: () => import('./views/category/category.module').then(m => m.CategoryModule) },
  { path: 'all-products', loadChildren: () => import('./views/category/category.module').then(m => m.CategoryModule) },
  { path: 'new-arrivals', loadChildren: () => import('./views/category/category.module').then(m => m.CategoryModule) },

  { path: 'product', loadChildren: () => import('./views/product/product.module').then(m => m.ProductModule) },
  
  { path: 'gift-cards', loadChildren: () => import('./views/features/gift-cards/gift-cards.module').then(m => m.GiftCardsModule) },
  { path: 'blogs', loadChildren: () => import('./views/features/blogs/blogs.module').then(m => m.BlogsModule) },
  { path: 'catalog-page', loadChildren: () => import('./views/features/discounts/discounts.module').then(m => m.DiscountsModule) },
  { path: 'sections/:type', loadChildren: () => import('./views/features/sections/sections.module').then(m => m.SectionsModule) },
  { path: 'brands', loadChildren: () => import('./views/features/collections/collections.module').then(m => m.CollectionsModule) },
  { path: 'services', loadChildren: () => import('./views/features/appointment/appointment.module').then(m => m.AppointmentModule) },
  { path: 'service-confirmed/:id', loadChildren: () => import('./views/features/appointment/service-placed/service-placed.module').then(m => m.ServicePlacedModule), canActivate: [AccountGuard] },
  { path: 'sizing-assistant/:id', loadChildren: () => import('./views/features/sizing-assistant/sizing-assistant.module').then(m => m.SizingAssistantModule) },
  { path: 'order-review/:id', loadChildren: () => import('./views/features/order-review/order-review.module').then(m => m.OrderReviewModule) },
  { path: 'shipping-calculator', loadChildren: () => import('./views/features/shipping-calculator/shipping-calculator.module').then(m => m.ShippingCalculatorModule) },
  
  { path: 'contact-us', loadChildren: () => import('./views/properties/contact-us/contact-us.module').then(m => m.ContactUsModule) },
  { path: 'about-us', loadChildren: () => import('./views/properties/about-us/about-us.module').then(m => m.AboutUsModule) },
  { path: 'store-locator', loadChildren: () => import('./views/properties/store-locator/store-locator.module').then(m => m.StoreLocatorModule) },
  { path: 'privacy-policy', loadChildren: () => import('./views/properties/policy/policy.module').then(m => m.PolicyModule) },
  { path: 'shipping-policy', loadChildren: () => import('./views/properties/policy/policy.module').then(m => m.PolicyModule) },
  { path: 'cancellation-policy', loadChildren: () => import('./views/properties/policy/policy.module').then(m => m.PolicyModule) },
  { path: 'terms-and-conditions', loadChildren: () => import('./views/properties/policy/policy.module').then(m => m.PolicyModule) },
  { path: 'pages/:type', loadChildren: () => import('./views/properties/extra-page/extra-page.module').then(m => m.ExtraPageModule) },

  { path: 'vendor-enquiry', loadChildren: () => import('./views/vendor/vendor-enquiry/vendor-enquiry.module').then(m => m.VendorEnquiryModule) },
  { path: 'vendor-register', loadChildren: () => import('./views/vendor/vendor-register/vendor-register.module').then(m => m.VendorRegisterModule) },
  { path: 'vendor-login', loadChildren: () => import('./views/vendor/vendor-login/vendor-login.module').then(m => m.VendorLoginModule) },

  { path: '404', loadChildren: () => import('./views/not-found/not-found.module').then(m => m.NotFoundModule) }
];

const routes: Routes = [
  { path: 'web-stories/:story_id', loadChildren: () => import('./views/stories/story-details/story-details.module').then(m => m.StoryDetailsModule) },
  { path: '', component: MainHeaderComponent, children: mainRoutes },
  { path: 'checkout', loadChildren: () => import('./views/checkout/checkout.module').then(m => m.CheckoutModule) },
  { path: 'others', loadChildren: () => import('./views/others/others.module').then(m => m.OthersModule) },
  
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      scrollPositionRestoration: 'enabled',
      /** Quicklink prefetch pulled category/product chunks during homepage PSI runs, competing with LCP. */
      preloadingStrategy: NoPreloading,
    }),
  ],
  exports: [RouterModule]
})

export class AppRoutingModule { }