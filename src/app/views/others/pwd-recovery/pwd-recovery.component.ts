import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { environment } from '../../../../environments/environment';
import { WishlistService } from '../../../services/wishlist.service';
import { CartlistService } from '../../../services/cartlist.service';
import { CommonService } from '../../../services/common.service';

@Component({
    selector: 'app-pwd-recovery',
    templateUrl: './pwd-recovery.component.html',
    styleUrls: ['./pwd-recovery.component.scss'],
    standalone: false
})

export class PwdRecoveryComponent implements OnInit {

  pwdForm: any = {}; params: any = {}; pageLoader: boolean;
  recoveryStatus: boolean; recoveryMsg: string;
  responseStatus: boolean; responseMsg: string;
  template_setting: any = environment.template_setting;

  constructor(private commonService: CommonService, private activeRoute: ActivatedRoute, private router: Router,
    private api: ApiService, private wishService: WishlistService, private cartService: CartlistService
  ) { }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params: Params) => {
      this.params = params; this.pageLoader = true; this.recoveryStatus = true;
      this.recoveryMsg = ""; this.responseMsg = "";
      if(this.params.token && this.params.token!='') {
        this.api.VALIDATE_FORGOT_REQUEST({ store_id: this.commonService.store_id, temp_token: this.params.token }).subscribe(result => {
          setTimeout(() => { this.pageLoader = false; }, 500);
          this.recoveryStatus = result.status;
          this.recoveryMsg = result.message;
          if(!result.status) console.log("response", result);
        });
      }
      else {
        this.recoveryStatus = false;
        this.recoveryMsg = "Invalid Recovery Link";
      }
    });
  }

  onPwdUpdate() {
    this.pwdForm.submit = true;
    this.api.UPDATE_PWD({ store_id: this.commonService.store_id, temp_token: this.params.token, new_pwd: this.pwdForm.new_pwd }).subscribe(result => {
      this.pwdForm.submit = false;
      this.responseStatus = result.status;
      this.responseMsg = result.message;
      if(result.status) {
        localStorage.removeItem("customer_token");
        delete this.commonService.customer_token;
        this.wishService.resetWishList([]);
        this.cartService.resetCartList([]);
        this.router.navigate(['/account']);
      }
      else console.log("response", result);
    });
  }

}