import { Component, EventEmitter, Inject, Input, Output, ViewChild, DOCUMENT } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { CommonService } from '../../../services/common.service';
import { CurrencyConversionService } from '../../../services/currency-conversion.service';
import { environment } from '../../../../environments/environment';

export interface FitCreateOpenConfig {
  addon_id: string;
  custom_list?: any[];
  measurement_sets?: any[];
  notes_list?: any[];
  notesTitle?: string;
  name?: string;
  mm_unit?: string;
  editingModelId?: string | null;
  modalTitle?: string;
  saveLabel?: string;
  showPrices?: boolean;
}

@Component({
  selector: 'app-fit-create-profile',
  templateUrl: './fit-create-profile.component.html',
  styleUrls: ['./fit-create-profile.component.scss'],
  standalone: false
})
export class FitCreateProfileComponent {

  @Input() showPrices = true;
  @Input() modalTitle = 'Create Measurement Profile';
  @Input() saveLabel = 'Save Fit Profile';
  @Output() saved = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('createNewModal', { static: false }) createNewModal: ModalDirective;

  imgBaseUrl = environment.img_baseurl;
  addonForm: any = {};
  custom_list: any[] = [];
  measurement_sets: any[] = [];
  notes_list: any[] = [];
  notesTitle = '';
  editingModelId: string | null = null;
  addon_id: string = '';

  customIndex = 0;
  mmIndex = 0;
  customSection = false;
  mmSection = false;
  noteSection = false;
  returnToReviewAfterEdit = false;
  selected_unit: any = {};
  reviewHalfCards: any[] = [];
  reviewFullCards: any[] = [];
  fitProfileNameSuggestions: string[] = ['Standard Blouse Fit', 'Summer Cotton Fit', 'Wedding Silk Fit'];

  constructor(
    public commonService: CommonService,
    public cc: CurrencyConversionService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  open(config: FitCreateOpenConfig): void {
    this.addon_id = config.addon_id;
    this.editingModelId = config.editingModelId || null;
    this.notesTitle = config.notesTitle || '';
    if (config.modalTitle) this.modalTitle = config.modalTitle;
    if (config.saveLabel) this.saveLabel = config.saveLabel;
    if (typeof config.showPrices === 'boolean') this.showPrices = config.showPrices;

    this.customIndex = 0;
    this.mmIndex = 0;
    this.returnToReviewAfterEdit = false;
    this.addonForm = {
      name: config.name || '',
      mm_unit: config.mm_unit || null,
      alert_msg: null,
      submit: false
    };

    this.custom_list = JSON.parse(JSON.stringify(config.custom_list || []));
    this.measurement_sets = JSON.parse(JSON.stringify(config.measurement_sets || []));
    this.notes_list = JSON.parse(JSON.stringify(config.notes_list || []));

    this.customSection = false;
    this.mmSection = false;
    this.noteSection = false;

    if (this.custom_list.length) {
      this.customSection = true;
      this.custom_list.forEach((obj: any) => {
        if (!config.editingModelId) {
          delete obj.selected_option;
          (obj.option_list || []).forEach((opt: any) => {
            delete opt.custom_option_checked;
            delete opt.disabled;
          });
        }
        if (!obj.filtered_option_list?.length) {
          obj.filtered_option_list = obj.option_list || [];
        }
      });
      const first = this.custom_list[0];
      first.filtered_option_list = first.option_list || first.filtered_option_list || [];
      if (first.type === 'either_or') {
        if (!first.selected_option && first.filtered_option_list.length) {
          first.selected_option = first.filtered_option_list[0].name;
        }
        if (first.selected_option) this.getRadioNextList(first.selected_option);
      }
    } else if (this.measurement_sets.length) {
      this.mmSection = true;
      if (!this.addonForm.mm_unit && this.measurement_sets[0]?.units?.length) {
        this.selected_unit = this.measurement_sets[0].units[0];
        this.addonForm.mm_unit = this.selected_unit.name;
      }
    } else {
      this.noteSection = true;
      this.rebuildReviewCards();
    }

    setTimeout(() => {
      this.createNewModal?.show();
      this.commonService.scrollModalTop(500);
    }, 0);
  }

  hide(): void {
    this.createNewModal?.hide();
  }

  setSubmitting(value: boolean): void {
    this.addonForm.submit = value;
  }

  setAlert(msg: string): void {
    this.addonForm.alert_msg = msg;
  }

  onCancel(): void {
    this.hide();
    this.cancelled.emit();
  }

  customPrev(): void {
    if (this.returnToReviewAfterEdit && (this.customSection || this.mmSection)) {
      this.goToReviewStep();
      return;
    }
    if (this.customSection) {
      this.customIndex -= 1;
    } else if (this.mmSection) {
      if (this.custom_list.length) {
        this.mmSection = false;
        this.customSection = true;
      }
    } else if (this.noteSection) {
      this.noteSection = false;
      if (this.measurement_sets.length) {
        this.mmSection = true;
        this.mmIndex = 0;
      } else {
        this.customSection = true;
      }
    }
    this.addonForm.alert_msg = null;
    this.commonService.scrollModalTop(0);
  }

  getCustomizationStepMeta() {
    const customSteps = this.custom_list?.length || 0;
    const mmSteps = this.measurement_sets?.length ? 1 : 0;
    const total = Math.max(1, customSteps + mmSteps + 1);
    let current = 1;
    let label = 'Customization';
    if (this.customSection) {
      current = (this.customIndex || 0) + 1;
      label = this.custom_list[this.customIndex]?.name || 'Customization';
    } else if (this.mmSection) {
      current = customSteps + 1;
      label = 'Body Measurements';
    } else if (this.noteSection) {
      current = customSteps + mmSteps + 1;
      label = 'Review & Save';
    }
    return {
      current,
      total,
      label,
      percent: Math.min(100, Math.round((current / total) * 100))
    };
  }

  isCustomListStyle(): boolean {
    const opts = this.custom_list?.[this.customIndex]?.filtered_option_list || [];
    if (!opts.length) return false;
    const withImage = opts.filter((o: any) => !!o.image).length;
    return withImage < Math.ceil(opts.length / 2);
  }

  isCustomOptionSelected(option: any): boolean {
    const step = this.custom_list?.[this.customIndex];
    if (!step || !option) return false;
    if (step.type === 'either_or') return step.selected_option === option.name;
    return !!option.custom_option_checked;
  }

  selectCustomOption(option: any): void {
    if (!option || option.disabled) return;
    const step = this.custom_list?.[this.customIndex];
    if (!step) return;
    this.addonForm.alert_msg = null;
    if (step.type === 'either_or') {
      step.selected_option = option.name;
      this.getRadioNextList(option.name);
      return;
    }
    option.custom_option_checked = !option.custom_option_checked;
    this.getCheckboxNextList();
    this.disableOption();
  }

  getCustomizationSummary(): any[] {
    const summary = [];
    (this.custom_list || []).forEach((step, index) => {
      if (step.type === 'either_or' && step.selected_option) {
        const selectedOpt = (step.filtered_option_list || step.option_list || [])
          .find((opt: any) => opt.name === step.selected_option);
        summary.push({
          label: step.name,
          value: step.selected_option,
          type: 'custom',
          index,
          image: selectedOpt?.image || null,
          fullWidth: false
        });
      } else if (step.filtered_option_list || step.option_list) {
        const selected = (step.filtered_option_list || step.option_list || [])
          .filter((opt: any) => opt.custom_option_checked);
        if (selected.length) {
          summary.push({
            label: step.name,
            value: selected.map((opt: any) => opt.name).join(', '),
            type: 'custom',
            index,
            image: selected.length === 1 ? (selected[0].image || null) : null,
            fullWidth: selected.length > 1 || !selected[0]?.image
          });
        }
      }
    });
    const mmCount = (this.measurement_sets || []).reduce((count, set) => {
      return count + (set.list || []).filter((item: any) =>
        item.value !== undefined && item.value !== null && item.value !== ''
      ).length;
    }, 0);
    if (mmCount) {
      summary.push({
        label: 'Measurements Summary',
        value: mmCount + ' Measurements Added' + (this.addonForm?.mm_unit ? ' • Unit: ' + this.addonForm.mm_unit : ''),
        type: 'mm',
        index: 0,
        fullWidth: true
      });
    }
    return summary;
  }

  rebuildReviewCards(): void {
    const summary = this.getCustomizationSummary();
    this.reviewHalfCards = summary.filter(item => !item.fullWidth);
    this.reviewFullCards = summary.filter(item => item.fullWidth);
  }

  trackReviewCard(_index: number, item: { type: string; index: number }) {
    return (item?.type || 'x') + '-' + (item?.index ?? _index);
  }

  onReviewEditClick(type: string, stepIndex: number): void {
    if (!type) return;
    this.addonForm.alert_msg = null;
    this.returnToReviewAfterEdit = true;
    this.customSection = false;
    this.mmSection = false;
    this.noteSection = false;

    if (type === 'mm') {
      if (!this.measurement_sets?.length) {
        this.goToReviewStep();
        return;
      }
      this.mmSection = true;
      this.mmIndex = Math.min(Math.max(Number(stepIndex) || 0, 0), this.measurement_sets.length - 1);
      if (!this.addonForm.mm_unit && this.measurement_sets[0]?.units?.length) {
        this.selected_unit = this.measurement_sets[0].units[0];
        this.addonForm.mm_unit = this.selected_unit.name;
      }
      this.scrollFitModalBody();
      setTimeout(() => {
        const target = this.document.getElementById('fit-mm-set-' + this.mmIndex);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    if (type === 'custom') {
      if (!this.custom_list?.length) {
        this.goToReviewStep();
        return;
      }
      try {
        this.prepareCustomStepsForEdit(Number(stepIndex) || 0);
      } catch (err) {
        console.error('prepareCustomStepsForEdit failed', err);
        const safeIndex = Math.min(Math.max(Number(stepIndex) || 0, 0), this.custom_list.length - 1);
        this.customIndex = safeIndex;
        const step = this.custom_list[safeIndex];
        if (step && !step.filtered_option_list?.length) {
          step.filtered_option_list = step.option_list || [];
        }
      }
      this.customSection = true;
      this.scrollFitModalBody();
    }
  }

  private prepareCustomStepsForEdit(targetIndex: number): void {
    const maxIndex = this.custom_list.length - 1;
    const safeIndex = Math.min(Math.max(targetIndex, 0), maxIndex);

    if (this.custom_list[0]) {
      this.custom_list[0].filtered_option_list = this.custom_list[0].option_list || [];
    }

    for (let i = 0; i < safeIndex; i++) {
      this.customIndex = i;
      const step = this.custom_list[i];
      if (!step) continue;
      if (!step.filtered_option_list?.length) {
        step.filtered_option_list = step.option_list || [];
      }
      if (step.type === 'either_or') {
        if (!step.selected_option && step.filtered_option_list?.length) {
          step.selected_option = step.filtered_option_list[0].name;
        }
        if (step.selected_option) this.getRadioNextList(step.selected_option);
      } else {
        this.getCheckboxNextList();
      }
    }

    this.customIndex = safeIndex;
    const targetStep = this.custom_list[safeIndex];
    if (!targetStep) return;
    if (!targetStep.filtered_option_list?.length) {
      targetStep.filtered_option_list = targetStep.option_list || [];
    }
    if (targetStep.type === 'either_or') {
      if (!targetStep.selected_option && targetStep.filtered_option_list?.length) {
        targetStep.selected_option = targetStep.filtered_option_list[0].name;
      }
    } else {
      this.disableOption();
    }
  }

  private scrollFitModalBody(): void {
    this.commonService.scrollModalTop(0);
    setTimeout(() => {
      const body = this.document.querySelector('.fit-profile-modal .fit-profile-modal__body') as HTMLElement;
      if (body) body.scrollTop = 0;
    }, 0);
  }

  private goToReviewStep(): void {
    this.customSection = false;
    this.mmSection = false;
    this.noteSection = true;
    this.returnToReviewAfterEdit = false;
    this.addonForm.alert_msg = null;
    this.rebuildReviewCards();
    this.scrollFitModalBody();
  }

  onCustomNext(gotoNext: boolean): void {
    const reqInput = this.validateForm();
    if (reqInput === undefined) {
      const customAlert = this.checkCustomSelection();
      if (!customAlert) {
        if (this.returnToReviewAfterEdit) {
          this.goToReviewStep();
          return;
        }
        if (!gotoNext) {
          this.mmSection = false;
          this.noteSection = false;
          this.customIndex = this.customIndex + 1;
          if (this.custom_list[this.customIndex].type === 'either_or') {
            if (this.custom_list[this.customIndex].selected_option) {
              if (this.custom_list[this.customIndex].filtered_option_list.findIndex(
                (obj: any) => obj.name === this.custom_list[this.customIndex].selected_option
              ) === -1) {
                this.custom_list[this.customIndex].selected_option =
                  this.custom_list[this.customIndex].filtered_option_list[0].name;
              }
            } else {
              this.custom_list[this.customIndex].selected_option =
                this.custom_list[this.customIndex].filtered_option_list[0].name;
            }
            this.getRadioNextList(this.custom_list[this.customIndex].selected_option);
          } else {
            this.disableOption();
          }
        } else {
          this.customSection = false;
          this.mmSection = false;
          this.noteSection = false;
          if (this.measurement_sets.length) {
            this.mmIndex = 0;
            this.mmSection = true;
            this.selected_unit = this.measurement_sets[this.mmIndex].units[0];
            this.addonForm.mm_unit = this.selected_unit.name;
          } else {
            this.goToReviewStep();
          }
        }
        this.commonService.scrollModalTop(0);
      } else {
        this.addonForm.alert_msg = customAlert;
      }
    } else {
      this.addonForm.alert_msg = 'Please fill out the mandatory fields';
      this.document.getElementById(reqInput)?.focus();
    }
  }

  onMmNext(): void {
    for (let s = 0; s < (this.measurement_sets?.length || 0); s++) {
      const set = this.measurement_sets[s];
      const missing = (set?.list || []).findIndex((item: any) =>
        item?.value === undefined || item?.value === null || String(item.value).trim() === ''
      );
      if (missing !== -1) {
        this.addonForm.alert_msg = 'Please complete ' + (set?.name || 'all') + ' measurements';
        const el = this.document.getElementById('fit_value' + s + missing);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }
    const reqInput = this.validateForm();
    if (reqInput === undefined) {
      this.applyMmAdditionalQty();
      this.goToReviewStep();
    } else {
      this.addonForm.alert_msg = 'Please fill out the mandatory fields';
      this.document.getElementById(reqInput)?.focus();
    }
  }

  onChangeUnit(): void {
    const unitSource = this.measurement_sets[this.mmIndex] || this.measurement_sets[0];
    const unitIndex = unitSource?.units?.findIndex((obj: any) => obj.name === this.addonForm.mm_unit);
    if (unitIndex != -1) this.selected_unit = unitSource.units[unitIndex];
    if (this.addonForm.mm_unit == 'cms') {
      this.measurement_sets.forEach(set => {
        set.list.forEach((element: any) => {
          if (element.value) {
            element.value = element.value * 2.54;
            if ((element.value % 1) != 0) element.value = parseFloat(element.value.toFixed(1));
          }
        });
      });
    } else {
      this.measurement_sets.forEach(set => {
        set.list.forEach((element: any) => {
          if (element.value) {
            element.value = element.value * 0.393701;
            if ((element.value % 1) != 0) element.value = parseFloat(element.value.toFixed(1));
          }
        });
      });
    }
  }

  onSave(): void {
    if (!this.addonForm?.name || !String(this.addonForm.name).trim()) {
      this.addonForm.alert_msg = 'Please enter a model profile name';
      this.document.getElementById('fit_model_name')?.focus();
      return;
    }
    const reqInput = this.validateForm();
    if (reqInput !== undefined) {
      this.addonForm.alert_msg = 'Please fill out the mandatory fields';
      this.document.getElementById(reqInput)?.focus();
      return;
    }
    const customAlert = this.checkCustomSelection();
    if (customAlert) {
      this.addonForm.alert_msg = customAlert;
      return;
    }

    const payload: any = {
      name: this.addonForm.name,
      addon_id: this.addon_id,
      mm_unit: this.addonForm.mm_unit,
      sid: this.commonService.session_id,
      custom_list: [],
      mm_sets: []
    };
    if (this.editingModelId) payload._id = this.editingModelId;

    this.custom_list.forEach((obj: any) => {
      if (!obj.filtered_option_list) return;
      if (obj.type === 'either_or') {
        const selIndex = obj.filtered_option_list.findIndex((opt: any) => opt.name === obj.selected_option);
        if (selIndex != -1) payload.custom_list.push({ name: obj.name, value: [obj.filtered_option_list[selIndex]] });
      } else {
        const selectedList = obj.filtered_option_list.filter((opt: any) => opt.custom_option_checked);
        if (selectedList.length) payload.custom_list.push({ name: obj.name, value: selectedList });
      }
    });

    if (this.measurement_sets.length) {
      this.applyMmAdditionalQty();
      payload.mm_sets = this.measurement_sets;
    }

    const noteIndex = this.notes_list.findIndex((obj: any) => obj.value && obj.value !== '');
    if (noteIndex != -1) payload.notes_list = this.notes_list;

    this.saved.emit(payload);
  }

  private applyMmAdditionalQty(): void {
    (this.measurement_sets || []).forEach(set => {
      (set.list || []).forEach((elem: any) => {
        elem.additional_qty = 0;
        if (elem.conditions?.length) {
          for (const cond of elem.conditions) {
            const filteredList = cond.list.filter((obj: any) => obj.unit == this.addonForm.mm_unit);
            if (filteredList.length) {
              elem.additional_qty = filteredList[0].additional_qty;
              if (parseFloat(elem.value) > filteredList[0].mm_from && filteredList[0].mm_to >= parseFloat(elem.value)) {
                elem.additional_qty = filteredList[0].additional_qty;
                break;
              }
            }
          }
        }
      });
    });
  }

  getRadioNextList(optionName: string): void {
    const nextStep = this.custom_list[this.customIndex + 1];
    if (!nextStep?.option_list?.length) return;
    nextStep.filtered_option_list = nextStep.option_list.filter(
      (obj: any) => obj.link_to == 'all' || obj.link_to == optionName
    );
  }

  getCheckboxNextList(): void {
    const currentStep = this.custom_list[this.customIndex];
    const nextStep = this.custom_list[this.customIndex + 1];
    if (!currentStep?.filtered_option_list || !nextStep?.option_list?.length) return;
    const selectedItems = [];
    currentStep.filtered_option_list.forEach((obj: any) => {
      if (obj.custom_option_checked) selectedItems.push(obj.name);
    });
    nextStep.filtered_option_list = nextStep.option_list.filter(
      (obj: any) => obj.link_to == 'all' || selectedItems.indexOf(obj.link_to) != -1
    );
  }

  disableOption(): void {
    const step = this.custom_list[this.customIndex];
    if (!step?.filtered_option_list?.length || !(step.limit > 0)) return;
    const checkedLen = step.filtered_option_list.filter((obj: any) => obj.custom_option_checked).length;
    if (step.limit == checkedLen) {
      step.filtered_option_list.forEach((obj: any) => {
        obj.disabled = true;
        if (obj.custom_option_checked) obj.disabled = false;
      });
    } else {
      step.filtered_option_list.forEach((obj: any) => { obj.disabled = false; });
    }
  }

  validateForm(): string | undefined {
    const form: any = this.document.getElementById('fit-create-form');
    if (!form?.elements) return undefined;
    for (const elem of form.elements) {
      if (elem.value === '' && elem.hasAttribute('required')) return elem.id;
    }
    return undefined;
  }

  mmFocusOut(x: any): void {
    if (x.value && x.value == 0) {
      x.value = '';
      x.alert_msg = 'Value must be greater than 0';
    } else if (this.selected_unit?.max_value > 0 && x.value > this.selected_unit.max_value) {
      x.value = '';
      x.alert_msg = 'Value must be less than or equal to ' + this.selected_unit.max_value;
    }
  }

  checkCustomSelection(): string | null {
    if (!this.custom_list.length) return null;
    const step = this.custom_list[this.customIndex];
    if (!step?.filtered_option_list) return null;
    const checkedLen = step.filtered_option_list.filter((obj: any) => obj.custom_option_checked).length;
    if (step.type == 'mandatory') {
      if (step.limit == checkedLen) return null;
      return 'Must choose ' + step.limit + ' options';
    }
    if (step.type == 'limited') {
      if (step.limit >= checkedLen) return null;
      return 'Choose maximum ' + step.limit + ' options';
    }
    return null;
  }
}
