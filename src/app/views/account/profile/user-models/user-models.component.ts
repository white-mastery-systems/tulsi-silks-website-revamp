import { Component, OnInit, Inject, DOCUMENT, ViewChild } from '@angular/core';

import { ApiService } from '../../../../services/api.service';
import { StoreApiService } from '../../../../services/store-api.service';
import { CommonService } from '../../../../services/common.service';
import { CurrencyConversionService } from '../../../../services/currency-conversion.service';
import { FitCreateProfileComponent } from '../../../../shared/modules/fit-profile/fit-create-profile.component';
import { environment } from './../../../../../environments/environment';

@Component({
    selector: 'app-user-models',
    templateUrl: './user-models.component.html',
    styleUrls: ['./user-models.component.scss', '../../../../shared/modules/fit-profile/fit-profile-modal.scss'],
    standalone: false
})
export class UserModelsComponent implements OnInit {

  @ViewChild('fitCreateProfile') fitCreateProfile: FitCreateProfileComponent;

  pageLoader = true; selected_unit: any = {};
  list: any = []; parent_mm_list: any = [];
  custom_list: any = []; addonForm: any = {}; deleteForm: any = {};
  customIndex: number = 0; mmIndex: number = 0;
  imgBaseUrl: string = environment.img_baseurl;
  template_setting: any = environment.template_setting;
  page: number = 1; pageSize: number = 10;
  selectedAddon: any = null;
  editTarget: any = null;
  editingModelId: string | null = null;
  bcList: any = [
    { name: "Home", position: 1, link: "/" },
    { name: "My Account", position: 2, link: "/account" },
    { name: "Measurements & Fits", position: 3, link: "/account/models" }
  ];

  constructor(
    private api: ApiService, private storeApi: StoreApiService, public commonService: CommonService, @Inject(DOCUMENT) private document, public cc: CurrencyConversionService
  ) { }

  ngOnInit(): void {
    this.pageLoader = true;
    this.commonService.breadCrumbList(this.bcList);
    this.loadModelList();
  }

  private loadModelList(): void {
    const finish = () => {
      setTimeout(() => { this.pageLoader = false; }, 300);
    };

    this.api.USER_DETAILS().subscribe({
      next: (result) => {
        if (result?.status) {
          this.setModelList(result.data?.model_list);
        } else {
          this.setModelList([]);
          console.log('response', result);
        }
        finish();
      },
      error: (err) => {
        this.setModelList([]);
        console.log('USER_DETAILS error', err);
        finish();
      }
    });
  }

  private setModelList(modelList: any): void {
    // API returns oldest → newest; show newest first so a newly added model appears at the top.
    this.list = Array.isArray(modelList) ? [...modelList].reverse() : [];
    this.list.forEach((obj: any, index: number) => {
      obj.index = index + 1;
      try {
        obj._previewSlots = this.getModelPreviewSlots(obj);
        obj._measurements = this.getModelMeasurements(obj);
      } catch (e) {
        console.log('model card map error', e);
        obj._previewSlots = [];
        obj._measurements = { unit: null, unitSymbol: '', items: [] };
      }
    });
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
      this.deleteForm.submit = false;
      if(result.status) {
        modalName.hide();
        this.setModelList(result.data?.model_list);
        this.page = 1;
      }
      else console.log("response", result);
    });
  }

  getModelPreviewSlots(model: any): Array<{ label: string; value: string; image?: string }> {
    return [
      this.getModelCustomSlot(model, ['front'], 0, 'Front Neck'),
      this.getModelCustomSlot(model, ['rear', 'back'], 1, 'Back Neck'),
      this.getModelCustomSlot(model, ['lining', 'clos', 'extra'], 2, 'Lining')
    ].filter(Boolean) as Array<{ label: string; value: string; image?: string }>;
  }

  getModelMeasurements(model: any): {
    unit: string | null;
    unitSymbol: string;
    items: Array<{ name: string; value: string }>;
  } {
    const sets = model?.mm_sets || [];
    const allItems = [];
    const highlightKeys = ['shoulder', 'chest', 'waist', 'length'];
    const highlightOrder = { shoulder: 0, chest: 1, waist: 2, length: 3 };

    sets.forEach((set: any) => {
      (set?.list || []).forEach((entry: any) => {
        if (!entry?.name) return;
        const raw = entry.value;
        if (raw === undefined || raw === null || String(raw).trim() === '') return;
        allItems.push({ name: entry.name, value: String(raw) });
      });
    });

    const items = allItems
      .filter(item => highlightKeys.some(key => String(item.name || '').toLowerCase().includes(key)))
      .sort((a, b) => {
        const aKey = highlightKeys.find(key => String(a.name || '').toLowerCase().includes(key)) || '';
        const bKey = highlightKeys.find(key => String(b.name || '').toLowerCase().includes(key)) || '';
        return (highlightOrder[aKey] ?? 99) - (highlightOrder[bKey] ?? 99);
      })
      .filter((item, index, list) => {
        const key = highlightKeys.find(k => String(item.name || '').toLowerCase().includes(k));
        return list.findIndex(other => String(other.name || '').toLowerCase().includes(key)) === index;
      });

    const unit = model?.mm_unit
      || sets[0]?.unit
      || sets[0]?.units?.[0]?.name
      || sets[0]?.list?.[0]?.unit
      || null;
    const unitLower = String(unit || '').toLowerCase();
    const unitSymbol = unitLower.includes('inch') || unitLower === 'in' || unitLower === 'inches'
      ? '"'
      : (unitLower.includes('cm') ? ' cm' : (unit ? ' ' + unit : ''));

    return { unit, unitSymbol, items };
  }

  openEditChoice(model: any, editChoiceModal: any): void {
    this.editTarget = model;
    editChoiceModal.show();
  }

  openEditModel(model: any): void {
    if (!model?.addon_id || !this.fitCreateProfile) return;
    this.editingModelId = model._id;
    this.editTarget = model;

    this.storeApi.ADDON_DETAILS(model.addon_id).subscribe(result => {
      if (!result.status) {
        console.log('response', result);
        return;
      }
      const addonDetails = result.data[0];
      this.selectedAddon = addonDetails;
      const custom_list = JSON.parse(JSON.stringify(addonDetails.custom_list || []));
      const notes_list = JSON.parse(JSON.stringify(
        model.notes_list?.length ? model.notes_list : (addonDetails.notes_list || [])
      ));

      custom_list.forEach((step, stepIndex) => {
        const saved = (model.custom_list || [])[stepIndex];
        step.filtered_option_list = step.option_list || [];
        if (step.type === 'either_or') {
          const selectedName = saved?.value?.[0]?.name;
          step.selected_option = selectedName || step.filtered_option_list[0]?.name;
        } else if (saved?.value?.length) {
          step.filtered_option_list.forEach((opt) => {
            opt.custom_option_checked = saved.value.some((v) => v.name === opt.name);
          });
        }
      });

      const openShared = (measurement_sets) => {
        this.fitCreateProfile.open({
          addon_id: model.addon_id,
          custom_list,
          measurement_sets,
          notes_list,
          notesTitle: addonDetails.notes_title || '',
          name: model.name || '',
          mm_unit: model.mm_unit || null,
          editingModelId: model._id,
          modalTitle: 'Edit Measurement Profile',
          saveLabel: 'Update Fit Profile',
          showPrices: false
        });
      };

      if (addonDetails.mm_list?.length || model.mm_sets?.length) {
        this.storeApi.PRODUCT_FEATURES().subscribe(featRes => {
          if (featRes.status) {
            const features = typeof featRes.data === 'string' ? JSON.parse(featRes.data) : featRes.data;
            const measurement_set = (features.measurement_set || [])
              .filter((obj) => obj.status === 'active')
              .sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
            this.buildMmList(addonDetails.mm_list || [], measurement_set).then((resp) => {
              const measurement_sets = JSON.parse(JSON.stringify(resp || []));
              (model.mm_sets || []).forEach((savedSet) => {
                const target = measurement_sets.find((set) => set.name === savedSet.name || set._id === savedSet._id);
                if (!target) return;
                (savedSet.list || []).forEach((savedRow) => {
                  const row = (target.list || []).find((r) => r.name === savedRow.name);
                  if (row) row.value = savedRow.value;
                });
              });
              openShared(measurement_sets);
            });
          } else {
            openShared(JSON.parse(JSON.stringify(model.mm_sets || [])));
          }
        });
      } else {
        openShared([]);
      }
    });
  }

  startCreate(): void {
    this.editingModelId = null;
    this.storeApi.PRODUCT_FEATURES().subscribe(result => {
      if (!result.status) {
        console.log('response', result);
        return;
      }
      const features = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
      const addons = (features?.addon_list || []).filter((addon) =>
        (addon?.custom_list?.length || addon?.mm_list?.length || addon?.notes_list?.length)
      );
      if (!addons.length) {
        console.log('No customization templates available.');
        return;
      }
      const blouseOnly = addons.find((addon) => {
        const name = String(addon?.name || '').toLowerCase();
        return name.includes('blouse') && !name.includes('falls');
      });
      this.selectAddonForCreate(blouseOnly || addons[0]);
    });
  }

  selectAddonForCreate(addon): void {
    this.selectedAddon = addon;
    this.storeApi.ADDON_DETAILS(addon._id).subscribe(result => {
      if (!result.status) {
        console.log('response', result);
        return;
      }
      const addonDetails = result.data[0] || addon;
      this.selectedAddon = addonDetails;
      const custom_list = JSON.parse(JSON.stringify(addonDetails.custom_list || []));
      const notes_list = (addonDetails.notes_list || []).map((obj) => ({
        name: obj.name,
        required: obj.required
      }));

      const openShared = (measurement_sets) => {
        this.fitCreateProfile.open({
          addon_id: addonDetails._id,
          custom_list,
          measurement_sets,
          notes_list,
          notesTitle: addonDetails.notes_title || '',
          modalTitle: 'Create Measurement Profile',
          saveLabel: 'Save Fit Profile',
          showPrices: false
        });
      };

      if (addonDetails.mm_list?.length) {
        this.storeApi.PRODUCT_FEATURES().subscribe(featRes => {
          if (featRes.status) {
            const features = typeof featRes.data === 'string' ? JSON.parse(featRes.data) : featRes.data;
            const measurement_set = (features.measurement_set || [])
              .filter((obj) => obj.status === 'active')
              .sort((a, b) => 0 - (a.rank > b.rank ? -1 : 1));
            this.buildMmList(addonDetails.mm_list, measurement_set).then((resp) => {
              const measurement_sets = JSON.parse(JSON.stringify(resp || []));
              measurement_sets.forEach((set) => {
                (set.list || []).forEach((row) => { row.value = ''; });
              });
              openShared(measurement_sets);
            });
          } else {
            openShared([]);
          }
        });
      } else {
        openShared([]);
      }
    });
  }

  onFitProfileSaved(payload): void {
    if (!this.fitCreateProfile) return;
    this.fitCreateProfile.setSubmitting(true);
    const request$ = payload._id ? this.api.UPDATE_MODEL(payload) : this.api.ADD_MODEL(payload);
    request$.subscribe(result => {
      this.fitCreateProfile.setSubmitting(false);
      if (result.status) {
        this.fitCreateProfile.hide();
        this.editingModelId = null;
        this.setModelList(result.data?.model_list);
        this.page = 1;
      } else {
        this.fitCreateProfile.setAlert(result.message);
        console.log('response', result);
      }
    });
  }

  onFitProfileCancelled(): void {
    this.editingModelId = null;
  }

  private getModelCustomSlot(model: any, keys: string[], fallbackIndex: number, displayLabel: string) {
    const list = model?.custom_list || [];
    if (!list.length) return null;

    let item = list.find((entry: any) => {
      const name = String(entry?.name || '').toLowerCase();
      return keys.some(key => name.includes(key));
    });
    if (!item) item = list[fallbackIndex];
    if (!item) return null;

    const values = item.value || [];
    const valueNames = values.map((v: any) => v?.name).filter(Boolean);
    return {
      label: displayLabel,
      value: valueNames.length ? valueNames.join(', ') : '—',
      image: values[0]?.image || null
    };
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
          this.addonForm.submit = false;
          if(result.status) {
            modalName.hide();
            this.setModelList(result.data?.model_list);
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
          this.setModelList(result.data?.model_list);
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
          this.setModelList(result.data?.model_list);
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