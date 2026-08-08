import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { WishlistService } from '../../../services/wishlist.service';
import { CartlistService } from '../../../services/cartlist.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false
})
export class ProfileComponent implements OnInit {

  pageLoader = true;
  customer_details: any = {};
  address_list: any[] = [];
  editMode = false;
  showPasswordPanel = false;
  editForm: any = {};
  pwdForm: any = {};
  addressFormType = 'add';
  addressForm: any = {};
  deleteForm: any = {};
  address_fields: any[] = [];
  state_list: any[] = [];
  country_details: any;
  mobile_pattern: any;
  mobileno_length: any;
  memberSinceYear: number | null = null;
  profileSaving = false;
  template_setting: any = environment.template_setting;
  bcList: any = [
    { name: 'Home', position: 1, link: '/' },
    { name: 'My Account', position: 2, link: '/account' },
    { name: 'My Profile', position: 3, link: '/account/profile' }
  ];

  constructor(
    public commonService: CommonService,
    private api: ApiService,
    private router: Router,
    private wishService: WishlistService,
    private cartService: CartlistService
  ) {
    this.commonService.breadCrumbList(this.bcList);
  }

  ngOnInit(): void {
    this.loadProfile();
    this.commonService.getCountryList();
  }

  get profileInitials(): string {
    const name = (this.customer_details?.name || '').trim();
    if (!name) return 'TS';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get isSocialAccount(): boolean {
    return !this.customer_details?.password;
  }

  loadProfile(): void {
    this.pageLoader = true;
    this.api.USER_DETAILS().subscribe(result => {
      if (result.status) {
        this.applyUserData(result.data);
      } else {
        console.log('response', result);
      }
      setTimeout(() => { this.pageLoader = false; }, 400);
    });
  }

  applyUserData(data: any): void {
    this.customer_details = data || {};
    this.address_list = Array.isArray(data?.address_list) ? data.address_list : [];
    this.commonService.user_details = {
      name: data.name,
      email: data.email,
      dial_code: data.dial_code,
      mobile: data.mobile
    };
    if (data.gst) this.commonService.user_details.gst = data.gst;
    localStorage.setItem('user_details', this.commonService.encryptData(this.commonService.user_details));

    const created = data.created_on || data.createdAt || data.joined_on;
    if (created) {
      const year = new Date(created).getFullYear();
      if (!Number.isNaN(year)) this.memberSinceYear = year;
    }
  }

  startEditProfile(): void {
    this.showPasswordPanel = false;
    this.editMode = true;
    this.editForm = {
      name: this.customer_details.name || '',
      dial_code: this.customer_details.dial_code || '',
      mobile: this.customer_details.mobile || '',
      errorMsg: null
    };
    this.commonService.getCountryList().then(() => {
      if (!this.editForm.dial_code) {
        const index = this.commonService.country_list.findIndex(
          (object: any) => object.name === this.commonService.store_details.country
        );
        if (index !== -1) {
          this.editForm.dial_code = this.commonService.country_list[index].dial_code;
        }
      }
      this.onDialCodeChange(this.editForm.dial_code);
    });
  }

  cancelEditProfile(): void {
    this.editMode = false;
    this.editForm = {};
    this.profileSaving = false;
  }

  saveProfile(): void {
    if (this.profileSaving) return;
    this.profileSaving = true;
    delete this.editForm.errorMsg;

    const nameChanged = this.commonService.user_details?.name !== this.editForm.name;
    const mobileChanged =
      this.commonService.user_details?.dial_code !== this.editForm.dial_code ||
      this.commonService.user_details?.mobile !== this.editForm.mobile;

    const finish = () => {
      this.profileSaving = false;
      this.editMode = false;
      this.editForm = {};
    };

    const updateMobile = () => {
      if (!mobileChanged) {
        finish();
        return;
      }
      this.api.UPDATE_USER_MOBILE({
        dial_code: this.editForm.dial_code,
        mobile: this.editForm.mobile
      }).subscribe(result => {
        if (result.status) {
          this.applyUserData(result.data);
          finish();
        } else {
          this.profileSaving = false;
          this.editForm.errorMsg = result.message || 'Unable to update phone number.';
          console.log('response', result);
        }
      });
    };

    if (nameChanged) {
      this.api.USER_UPDATE({ name: this.editForm.name }).subscribe(result => {
        if (result.status) {
          this.applyUserData(result.data);
          updateMobile();
        } else {
          this.profileSaving = false;
          this.editForm.errorMsg = result.message || 'Unable to update profile.';
          console.log('response', result);
        }
      });
    } else {
      updateMobile();
    }
  }

  openPasswordPanel(): void {
    this.editMode = false;
    this.showPasswordPanel = true;
    this.pwdForm = {};
  }

  cancelPasswordPanel(): void {
    this.showPasswordPanel = false;
    this.pwdForm = {};
  }

  onChangePwd(modalName?: any): void {
    this.pwdForm.submit = true;
    delete this.pwdForm.errorMsg;
    this.api.CHANGE_PWD(this.pwdForm).subscribe(result => {
      this.pwdForm.submit = false;
      if (result.status) {
        if (modalName) modalName.hide();
        this.showPasswordPanel = false;
        localStorage.removeItem('customer_token');
        delete this.commonService.customer_token;
        this.wishService.resetWishList([]);
        this.cartService.resetCartList([]);
        this.router.navigate(['/account']);
      } else {
        this.pwdForm.errorMsg = result.message;
        console.log('response', result);
      }
    });
  }

  onDialCodeChange(x: string): void {
    delete this.mobileno_length;
    delete this.mobile_pattern;
    const index = this.commonService.country_list.findIndex((object: any) => object.dial_code === x);
    if (index !== -1) {
      const countryDetails = this.commonService.country_list[index];
      if (countryDetails.mobileno_length) {
        this.mobileno_length = countryDetails.mobileno_length;
        this.mobile_pattern = '.{' + countryDetails.mobileno_length + ',' + countryDetails.mobileno_length + '}';
      }
    }
  }

  setAddressType(type: 'home' | 'office' | 'other'): void {
    this.addressForm.type = type;
    if (type !== 'other') this.addressForm.other_place = null;
  }

  addressTypeLabel(address: any): string {
    if (address?.type === 'other' && address?.other_place) return String(address.other_place);
    return String(address?.type || 'home').toUpperCase();
  }

  addressDefaultLabel(address: any): string | null {
    if (!address?.billing_address && !address?.shipping_address) return null;
    if (address.billing_address && address.shipping_address) return 'Default · Billing & Shipping';
    if (address.billing_address) return 'Default · Billing';
    return 'Default · Shipping';
  }

  addressLine(address: any): string {
    const locality = [address?.address, address?.city, address?.state, address?.country]
      .filter(Boolean)
      .join(', ');
    if (address?.pincode) return `${locality} - ${address.pincode}`;
    return locality;
  }

  onAddAddress(modalName: any): void {
    this.addressFormType = 'add';
    this.addressForm = {
      type: 'home',
      country: this.commonService.store_details.country
    };
    if (!this.address_list.length) {
      this.addressForm.billing_address = true;
      this.addressForm.shipping_address = true;
    }
    this.onCountryChange(this.addressForm.country);
    modalName.show();
    this.commonService.scrollModalTop(500);
  }

  onEditAddress(x: any, modalName: any): void {
    this.addressFormType = 'update';
    this.onCountryChange(x.country);
    this.addressForm = {};
    for (const key in x) {
      if (Object.prototype.hasOwnProperty.call(x, key)) this.addressForm[key] = x[key];
    }
    this.addressForm.exist_billing = this.addressForm.billing_address;
    this.addressForm.exist_shipping = this.addressForm.shipping_address;
    this.address_fields.forEach(element => {
      element.value = this.addressForm[element.keyword];
    });
    modalName.show();
    this.commonService.scrollModalTop(500);
  }

  onSubmitAddress(type: string, modalName: any): void {
    this.address_fields.forEach(element => {
      if (element.value) this.addressForm[element.keyword] = element.value;
    });
    if (
      this.commonService.ys_features.indexOf('pincode_service') !== -1 &&
      this.commonService.store_properties.pincodes.length &&
      this.commonService.store_properties.pincodes.indexOf(this.addressForm.pincode) === -1
    ) {
      this.addressForm.error_msg = 'Service not available for this pincode.';
      return;
    }

    this.addressForm.submit = true;
    const request$ = type === 'add'
      ? this.api.ADD_ADDRESS(this.addressForm)
      : this.api.UPDATE_ADDRESS(this.addressForm);

    request$.subscribe(result => {
      this.addressForm.submit = false;
      if (result.status) {
        modalName.hide();
        this.address_list = result.data.address_list || [];
        this.customer_details.address_list = this.address_list;
      } else {
        console.log('response', result);
        this.addressForm.error_msg = result.message || 'Unable to save address.';
      }
    });
  }

  confirmDeleteAddress(address: any, modalName: any): void {
    this.deleteForm = { ...address };
    modalName.show();
  }

  onDeleteAddress(modalName: any): void {
    this.deleteForm.submit = true;
    this.api.DELETE_ADDRESS(this.deleteForm).subscribe(result => {
      this.deleteForm.submit = false;
      if (result.status) {
        modalName.hide();
        this.address_list = result.data.address_list || [];
        this.customer_details.address_list = this.address_list;
      } else {
        console.log('response', result);
      }
    });
  }

  onCountryChange(x: string): void {
    this.state_list = [];
    this.address_fields = [];
    delete this.country_details;
    delete this.mobile_pattern;
    const index = this.commonService.country_list.findIndex((object: any) => object.name === x);
    if (index !== -1) {
      this.country_details = this.commonService.country_list[index];
      this.state_list = this.country_details.states || [];
      this.addressForm.dial_code = this.country_details.dial_code;
      this.address_fields = (this.country_details.address_fields || []).map((field: any) => ({ ...field }));
      if (this.country_details.mobileno_length) {
        this.mobile_pattern = '.{' + this.country_details.mobileno_length + ',' + this.country_details.mobileno_length + '}';
      }
    }
  }

  onLogout(modalName: any): void {
    localStorage.removeItem('customer_token');
    delete this.commonService.customer_token;
    this.wishService.resetWishList([]);
    this.cartService.resetCartList([]);
    modalName.hide();
    this.router.navigate(['/account']);
  }
}
