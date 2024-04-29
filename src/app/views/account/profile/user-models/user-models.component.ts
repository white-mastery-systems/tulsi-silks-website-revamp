import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ApiService } from '../../../../services/api.service';
import { StoreApiService } from '../../../../services/store-api.service';
import { CommonService } from '../../../../services/common.service';
import { CurrencyConversionService } from '../../../../services/currency-conversion.service';
import { environment } from './../../../../../environments/environment';

@Component({
  selector: 'app-user-models',
  templateUrl: './user-models.component.html',
  styleUrls: ['./user-models.component.scss']
})
export class UserModelsComponent implements OnInit {

  pageLoader: boolean; selected_unit: any = {};
  list: any = []; parent_mm_list: any = [];
  custom_list: any = []; addonForm: any = {}; deleteForm: any = {};
  customIndex: number; mmIndex: number = 0;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  page: number = 1; pageSize: number = 10;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "My Account", position: 2, link: "/account" },
    { name: "My Profile", position: 3, link: "/account/profile" },
    { name: "Custom Model", position: 4, link: "/account/profile/models" }
  ];

  constructor(
    private api: ApiService, private storeApi: StoreApiService, public commonService: CommonService, @Inject(DOCUMENT) private document, public cc: CurrencyConversionService
  ) { }

  ngOnInit(): void {
    if(this.commonService.store_details.additional_features && this.commonService.store_details.additional_features.custom_model) {
      this.pageLoader = true;
      this.api.USER_DETAILS().subscribe(result => {
        if(result.status) {
          this.list = result.data.model_list;
          this.list.forEach((obj, index) => {
            obj.index = index+1;
          });
        }
        else console.log("response", result);
        setTimeout(() => { this.pageLoader = false; }, 500);
      });
    }
    // schema
    this.commonService.breadCrumbList(this.bcList);
  }

  onEdit(type, modelId, modalName) {
    this.api.USER_DETAILS().subscribe(result => {
      if(result.status) {
        let modelList = result.data.model_list;
        let index = modelList.findIndex(obj => obj._id==modelId);
        if(index!=-1) {
          this.addonForm = modelList[index];
          this.storeApi.ADDON_DETAILS(this.addonForm.addon_id).subscribe(result => {
            if(result.status) {
              let addonDetails = result.data[0];
              // customization
              if(type=="custom") {
                this.customIndex = 0;
                this.custom_list = addonDetails.custom_list;
                this.custom_list[this.customIndex].filtered_option_list = this.custom_list[this.customIndex].option_list;
                let customList = this.addonForm.custom_list[this.customIndex];
                if(this.custom_list[this.customIndex].type=='either_or') {
                  if(customList.value && customList.value.length) {
                    let selectedOption = customList.value[0];
                    let optIndex = this.custom_list[this.customIndex].filtered_option_list.findIndex(obj => obj.name==selectedOption.name);
                    if(optIndex!=-1) {
                      this.custom_list[this.customIndex].selected_option = this.custom_list[this.customIndex].filtered_option_list[optIndex].name;
                      this.getRadioNextList(this.custom_list[this.customIndex].selected_option);
                    }
                  }
                  else {
                    this.custom_list[this.customIndex].selected_option = this.custom_list[this.customIndex].filtered_option_list[0].name;
                    this.getRadioNextList(this.custom_list[this.customIndex].selected_option);
                  }
                }
                else {
                  if(customList.value) {
                    this.custom_list[this.customIndex].filtered_option_list.forEach(opt => {
                      let optionIndex = customList.value.findIndex(obj => obj.name==opt.name);
                      if(optionIndex!=-1) opt.custom_option_checked = true;
                    });
                    this.getCheckboxNextList();
                  }
                  this.disableOption();
                }
                modalName.show();
                this.commonService.scrollModalTop(500);
              }
              // measurement
              else if(type=="measurement") {
                this.mmIndex = 0;
                this.storeApi.PRODUCT_FEATURES().subscribe(result => {
                  if(result.status) {
                    let productFeatures = JSON.parse(result.data);
                    let measurement_set = productFeatures.measurement_set.filter(obj => obj.status == 'active').sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
                    this.buildMmList(addonDetails.mm_list, measurement_set).then((resp: any) => {
                      this.parent_mm_list = resp;
                      this.updateCurrentMmList();
                      modalName.show();
                      this.commonService.scrollModalTop(500);
                    });
                  }
                  else console.log("response", result);
                });
              }
              else {
                modalName.show();
                this.commonService.scrollModalTop(500);
              }
            }
            else console.log("response", result);
          });
        }
        else console.log("invalid model");
      }
      else console.log("response", result);
    });
  }

  onDelete(modalName) {
    this.deleteForm.submit = true;
    this.api.DELETE_MODEL(this.deleteForm).subscribe(result => {
      if(result.status) {
        modalName.hide();
        this.list = result.data.model_list;
        this.page = 1;
      }
      else console.log("response", result);
    });
  }

  // custom section
  getRadioNextList(optionName) {
    // if next option list exist
    if(this.custom_list[this.customIndex+1]) {
      this.custom_list[this.customIndex+1].filtered_option_list = this.custom_list[this.customIndex+1].option_list.filter(obj => obj.link_to=='all' || obj.link_to==optionName);
    }
  }
  getCheckboxNextList() {
    // if next option list exist
    if(this.custom_list[this.customIndex+1])
    {
      let selectedItems = [];
      this.custom_list[this.customIndex].filtered_option_list.forEach(obj => {
        if(obj.custom_option_checked) selectedItems.push(obj.name);
      });
      this.custom_list[this.customIndex+1].filtered_option_list = this.custom_list[this.customIndex+1].option_list.filter(obj => obj.link_to=='all' || selectedItems.indexOf(obj.link_to)!=-1);
    }
  }
  disableOption() {
    // for mandatory or limited options
    if(this.custom_list[this.customIndex].limit > 0) {
      // for disable unchecked checkbox
      let checkedLen = this.custom_list[this.customIndex].filtered_option_list.filter(obj => obj.custom_option_checked).length;
      if(this.custom_list[this.customIndex].limit==checkedLen) {
        this.custom_list[this.customIndex].filtered_option_list.forEach(obj => {
          obj.disabled = true;
          if(obj.custom_option_checked) obj.disabled = false;
        });
      }
      else this.custom_list[this.customIndex].filtered_option_list.forEach(obj => { obj.disabled = false; });
    }
  }
  onCustomNext() {
    let reqInput = this.validateForm('custom-form');
    if(reqInput===undefined) {
      let customAlert = this.checkCustomSelection();
      if(!customAlert) {
        this.customIndex = this.customIndex+1;
        if(this.custom_list[this.customIndex].type=='either_or') {
          if(this.custom_list[this.customIndex].selected_option) {
            if(this.custom_list[this.customIndex].filtered_option_list.findIndex(obj => obj.name==this.custom_list[this.customIndex].selected_option) == -1) {
              this.custom_list[this.customIndex].selected_option = this.custom_list[this.customIndex].filtered_option_list[0].name;
            }
          }
          else {
            this.custom_list[this.customIndex].selected_option = this.custom_list[this.customIndex].filtered_option_list[0].name;
            let customList = this.addonForm.custom_list[this.customIndex];
            if(customList && customList.value && customList.value.length) {
              let selectedOption = customList.value[0];
              let optIndex = this.custom_list[this.customIndex].filtered_option_list.findIndex(obj => obj.name==selectedOption.name);
              if(optIndex!=-1) {
                this.custom_list[this.customIndex].selected_option = this.custom_list[this.customIndex].filtered_option_list[optIndex].name;
              }
            }
          }
          this.getRadioNextList(this.custom_list[this.customIndex].selected_option);
        }
        else {
          this.disableOption();
          if(this.addonForm.custom_list[this.customIndex]) {
            this.custom_list[this.customIndex].filtered_option_list.forEach(opt => {
              let optionIndex = this.addonForm.custom_list[this.customIndex].value.findIndex(obj => obj.name==opt.name);
              if(optionIndex!=-1) opt.custom_option_checked = true;
            });
            this.getCheckboxNextList();
          }
        }
        this.commonService.scrollModalTop(0);
      }
      else this.addonForm.alert_msg = customAlert;
    }
    else {
      this.addonForm.alert_msg = "Please fill out the mandatory fields";
      this.document.getElementById(reqInput).focus();
    }
  }

  onUpdateCustom(modalName) {
    let reqInput = this.validateForm('custom-form');
    if(reqInput===undefined) {
      let customAlert = this.checkCustomSelection();
      if(!customAlert) {
        this.addonForm.submit = true;
        this.addonForm.custom_list = [];
        this.custom_list.forEach(obj => {
          if(obj.filtered_option_list) {
            if(obj.type=="either_or") {
              let selIndex = obj.filtered_option_list.findIndex(opt => opt.name==obj.selected_option);
              if(selIndex!=-1) this.addonForm.custom_list.push({ name: obj.name, value: [obj.filtered_option_list[selIndex]] });
            }
            else {
              let selectedList = obj.filtered_option_list.filter(opt => opt.custom_option_checked);
              if(selectedList.length) this.addonForm.custom_list.push({ name: obj.name, value: selectedList })
            }
          }
        });
        this.api.UPDATE_MODEL(this.addonForm).subscribe(result => {
          this.addonForm.submit = true;
          if(result.status) {
            modalName.hide();
            this.list = result.data.model_list;
          }
          else {
            this.addonForm.alert_msg = result.message;
            console.log("response", result);
          }
        });
      }
      else this.addonForm.alert_msg = customAlert;
    }
    else {
      this.addonForm.alert_msg = "Please fill out the mandatory fields";
      this.document.getElementById(reqInput).focus();
    }
  }

  // measurement section
  buildMmList(mmList, overallmmList) {
    return new Promise((resolve, reject) => {
      let mmSetArray = [];
      mmList.forEach(obj => {
        let mmIndex = overallmmList.findIndex(elem => elem._id==obj.mmset_id);
        if(mmIndex!=-1) mmSetArray.push(overallmmList[mmIndex]);
      });
      resolve(mmSetArray);
    });
  }
  updateCurrentMmList() {
    let parentMmIndex = this.parent_mm_list.findIndex(obj => obj.name==this.addonForm.mm_sets[this.mmIndex].name);
    if(parentMmIndex!=-1) {
      let selectedMmSet = this.parent_mm_list[parentMmIndex];
      // units
      this.addonForm.mm_sets[this.mmIndex].units = selectedMmSet.units;
      let unitIndex = this.addonForm.mm_sets[this.mmIndex].units.findIndex(obj => obj.name==this.addonForm.mm_unit);
      if(unitIndex!=-1) {
        this.selected_unit = this.addonForm.mm_sets[this.mmIndex].units[unitIndex];
        this.addonForm.mm_unit = this.selected_unit.name;
      }
      else {
        this.addonForm.mm_sets[this.mmIndex].units = [{ max_value: 0, name: this.addonForm.mm_unit }];
        this.selected_unit = this.addonForm.mm_sets[this.mmIndex].units[0];
      }
      // list
      for(let list of this.addonForm.mm_sets[this.mmIndex].list) {
        let listIndex = selectedMmSet.list.findIndex(obj => obj.name==list.name);
        if(listIndex!=-1) list.conditions = selectedMmSet.list[listIndex].conditions;
      }
    }
    else {
      this.addonForm.mm_sets[this.mmIndex].units = [{ max_value: 0, name: this.addonForm.mm_unit }];
      this.selected_unit = this.addonForm.mm_sets[this.mmIndex].units[0];
    }
  }
  onChangeUnit() {
    let unitIndex = this.addonForm.mm_sets[this.mmIndex].units.findIndex(obj => obj.name==this.addonForm.mm_unit);
    if(unitIndex!=-1) this.selected_unit = this.addonForm.mm_sets[this.mmIndex].units[unitIndex];
    if(this.addonForm.mm_unit=='cms') {
      // convert inch -> cm
      this.addonForm.mm_sets.forEach(set => {
        set.list.forEach(element => {
          if(element.value) {
            element.value = element.value*2.54;
            if((element.value % 1) != 0) element.value = parseFloat(element.value.toFixed(1));
          }
        });
      });
    }
    else {
      // convert cm -> inch
      this.addonForm.mm_sets.forEach(set => {
        set.list.forEach(element => {
          if(element.value) {
            element.value = element.value*0.393701;
            if((element.value % 1) != 0) element.value = parseFloat(element.value.toFixed(1));
          }
        });
      });
    }
  }
  onMmNext() {
    let reqInput = this.validateForm('mm-form');
    if(reqInput===undefined) {
      // for find additional qty
      for(let elem of this.addonForm.mm_sets[this.mmIndex].list) {
        elem.additional_qty = 0;
        if(elem.conditions && elem.conditions.length) {
          for(let cond of elem.conditions) {
            let filteredList = cond.list.filter(obj => obj.unit==this.addonForm.mm_unit);
            if(filteredList.length) {
              elem.additional_qty = filteredList[0].additional_qty;
              if(parseFloat(elem.value)>filteredList[0].mm_from && filteredList[0].mm_to>=parseFloat(elem.value)) {
                elem.additional_qty = filteredList[0].additional_qty;
                break;
              }
            }
          }
        }
      }
      this.mmIndex = this.mmIndex+1;
      this.updateCurrentMmList();
      this.commonService.scrollModalTop(0);
    }
    else {
      this.addonForm.alert_msg = "Please fill out the mandatory fields";
      this.document.getElementById(reqInput).focus();
    }
  }
  mmFocusOut(x) {
    if(x.value && x.value==0) {
      x.value=''; x.alert_msg = "Value must be greater than 0"; 
    }
    else if(this.selected_unit.max_value>0 && x.value>this.selected_unit.max_value) {
      x.value=''; x.alert_msg = "Value must be less than or equal to "+this.selected_unit.max_value;
    }
  }

  onUpdateMeasurement(modalName) {
    let reqInput = this.validateForm('mm-form');
    if(reqInput===undefined) {
      // for find additional qty
      for(let elem of this.addonForm.mm_sets[this.mmIndex].list) {
        elem.additional_qty = 0;
        if(elem.conditions && elem.conditions.length) {
          for(let cond of elem.conditions) {
            let filteredList = cond.list.filter(obj => obj.unit==this.addonForm.mm_unit);
            if(filteredList.length) {
              elem.additional_qty = filteredList[0].additional_qty;
              if(parseFloat(elem.value)>filteredList[0].mm_from && filteredList[0].mm_to>=parseFloat(elem.value)) {
                elem.additional_qty = filteredList[0].additional_qty;
                break;
              }
            }
          }
        }
      }
      this.addonForm.submit = true;
      this.api.UPDATE_MODEL(this.addonForm).subscribe(result => {
        this.addonForm.submit = false;
        if(result.status) {
          modalName.hide();
          this.list = result.data.model_list;
        }
        else {
          this.addonForm.alert_msg = result.message;
          console.log("response", result);
        }
      });
    }
    else {
      this.addonForm.alert_msg = "Please fill out the mandatory fields";
      this.document.getElementById(reqInput).focus();
    }
  }

  // notes section
  onUpdateNotes(modalName) {
    let reqInput = this.validateForm('notes-form');
    if(reqInput===undefined) {
      this.addonForm.submit = true;
      this.api.UPDATE_MODEL(this.addonForm).subscribe(result => {
        this.addonForm.submit = false;
        if(result.status) {
          modalName.hide();
          this.list = result.data.model_list;
        }
        else {
          this.addonForm.alert_msg = result.message;
          console.log("response", result);
        }
      });
    }
    else {
      this.addonForm.alert_msg = "Please fill out the mandatory fields";
      this.document.getElementById(reqInput).focus();
    }
  }

  // common
  validateForm(formType) {
    let form: any = this.document.getElementById(formType);
    for(let elem of form.elements) {
      if(elem.value === '' && elem.hasAttribute('required')) return elem.id;
    }
  }
  checkCustomSelection() {
    let checkedLen = this.custom_list[this.customIndex].filtered_option_list.filter(obj => obj.custom_option_checked).length;
    if(this.custom_list[this.customIndex].type=='mandatory') {
      if(this.custom_list[this.customIndex].limit==checkedLen) return null;
      else return "Must choose "+this.custom_list[this.customIndex].limit+" options";
    }
    else if(this.custom_list[this.customIndex].type=='limited') {
      if(this.custom_list[this.customIndex].limit >= checkedLen) return null;
      else return "Choose maximum "+this.custom_list[this.customIndex].limit+" options";
    }
    else return null;
  }

}