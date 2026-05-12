import { Component, ElementRef, HostListener, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { StoreApiService } from '../../../services/store-api.service';
import { CommonService } from '../../../services/common.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})

export class FooterComponent {

  subscribeForm: any = {};
  imgBaseUrl: string = environment.img_baseurl;
  currentYear: any = (new Date()).getFullYear();

  /** Shown below address/contact in footer (brick-and-mortar hours). */
  readonly footerOpeningHoursLine = 'Open: Mon–Sat, 9:30 am – 7:30 pm';

  /** Brand column: short story below logo (Tulsi). */
  readonly footerBrandIntro =
    'Weavers of heritage Kancheepuram silks since 1978. Every saree carries a thread of tradition, handcrafted for the woman who values authenticity.';

  /** Line under social icons in brand column. */
  readonly footerSocialCaption = 'Follow for saree styling inspiration';

  /** API-driven; `tel:+91…` via `CommonService.getFooterPrimaryPhone()`. */
  get footerPhone(): { telHref: string; display: string } | null {
    return this.commonService.getFooterPrimaryPhone();
  }

  private lastFocusedEl: HTMLElement | null = null;
  private subscribeModalOpen = false;

  @ViewChild('subscribeModalContent') private subscribeModalContent?: ElementRef<HTMLElement>;
  @ViewChild('subscribeCloseBtn') private subscribeCloseBtn?: ElementRef<HTMLButtonElement>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private storeApi: StoreApiService, public commonService: CommonService, public router: Router) { }

  openSubscribeModal(modalRef: any): void {
    if (isPlatformBrowser(this.platformId)) {
      this.lastFocusedEl = (document.activeElement as HTMLElement) || null;
    }
    this.subscribeForm = {};
    modalRef?.show?.();
  }

  closeSubscribeModal(modalRef: any): void {
    modalRef?.hide?.();
  }

  onSubscribeModalShown(): void {
    this.subscribeModalOpen = true;
    // Initial focus: close button (reliable even when input is conditionally rendered).
    setTimeout(() => this.subscribeCloseBtn?.nativeElement?.focus?.());
  }

  onSubscribeModalHidden(): void {
    this.subscribeModalOpen = false;
    const el = this.lastFocusedEl;
    this.lastFocusedEl = null;
    // Restore focus to the element that opened the modal.
    setTimeout(() => el?.focus?.());
  }

  onSubscribeModalKeydown(event: KeyboardEvent): void {
    if (!this.subscribeModalOpen) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      // Modal instance handles closing via backdrop; trigger close by clicking the close button.
      this.subscribeCloseBtn?.nativeElement?.click?.();
      return;
    }

    if (event.key !== 'Tab') return;

    const root = this.subscribeModalContent?.nativeElement;
    if (!root) return;

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => {
      if (node.hasAttribute('hidden')) return false;
      const style = window.getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    // Fallback: Escape closes even if focus isn't inside modal content.
    if (!this.subscribeModalOpen) return;
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      this.subscribeCloseBtn?.nativeElement?.click?.();
    }
  }

  onSubscribe(modalName) {
    this.subscribeForm.submit = true;
    this.subscribeForm.store_id = this.commonService.store_id;
    this.storeApi.SUBSCRIBE_NEWSLETTER(this.subscribeForm).subscribe(result => {
      this.subscribeForm.status = result.status;
      if(result.status) this.subscribeForm.alert_msg = "Thank you for subscribing.";
      else {
        this.subscribeForm.alert_msg = "Error! Try again later.";
        console.log("response", result);
      }
      setTimeout(() => { modalName.hide(); }, 2000);
    });
  }

  linkNavigate(x) {
    if(x.link_type == 'internal') {
      this.router.navigate([x.link]);
    }
    else if(isPlatformBrowser(this.platformId) && x.link_type == 'external') {
      window.open(x.link, "_blank");
    }
  }

}