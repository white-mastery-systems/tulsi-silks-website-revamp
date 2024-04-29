import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonService } from '../services/common.service';

@Injectable({
  providedIn: 'root'
})

export class GuestGuard implements CanActivate {

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router : Router, private commonService: CommonService) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if(this.commonService.application_setting.guest_checkout && !localStorage.getItem('customer_token')) {
      if(isPlatformBrowser(this.platformId) && !sessionStorage.getItem('guest_email')) {
        return true;
      }
      else {
        this.router.navigate(['/account']);
        return false;
      }
    }
    else {
      this.router.navigate(['/account']);
      return false;
    }
  }
  
}