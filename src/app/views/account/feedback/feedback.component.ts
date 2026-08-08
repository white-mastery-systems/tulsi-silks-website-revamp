import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { CommonService } from '../../../services/common.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  standalone: false
})
export class FeedbackComponent implements OnInit {

  feedForm: any = {};
  pageLoader = true;
  hasExistingFeedback = false;
  feedbackSuccess: boolean;
  feedbackFailure: boolean;
  template_setting: any = environment.template_setting;
  ratingOptions = [
    { label: 'Bad', value: '1' },
    { label: 'Average', value: '3' },
    { label: 'Satisfactory', value: '4' },
    { label: 'Good', value: '2' },
    { label: 'Excellent', value: '5' }
  ];
  ratingRows = [
    { key: 'quality', label: 'Product Quality' },
    { key: 'pricing', label: 'Boutique Packaging' },
    { key: 'shipping', label: 'Delivery Service' }
  ];
  bcList: any = [
    { name: 'Home', position: 1, link: '/' },
    { name: 'My Account', position: 2, link: '/account' },
    { name: 'Give Feedback', position: 3, link: '/account/feedback' }
  ];

  constructor(private api: ApiService, public commonService: CommonService) {}

  ngOnInit(): void {
    this.commonService.breadCrumbList(this.bcList);
    if (
      this.commonService.ys_features.indexOf('customer_feedback') !== -1 &&
      this.commonService.application_setting?.feedback
    ) {
      this.loadFeedback();
      return;
    }
    this.resetForm();
    this.pageLoader = false;
  }

  loadFeedback(showLoader = true): void {
    if (showLoader) this.pageLoader = true;
    this.api.GET_FEEDBACK().subscribe(result => {
      if (showLoader) this.pageLoader = false;
      const latest = result?.status && Array.isArray(result.list) ? result.list[0] : null;
      if (latest) {
        this.applyFeedbackData(latest);
      } else {
        this.resetForm();
        this.hasExistingFeedback = false;
      }
    }, () => {
      if (showLoader) this.pageLoader = false;
      this.resetForm();
      this.hasExistingFeedback = false;
    });
  }

  private applyFeedbackData(feedback: any): void {
    if (!feedback) {
      this.resetForm();
      this.hasExistingFeedback = false;
      return;
    }

    this.feedForm = {
      quality: feedback.quality != null ? String(feedback.quality) : null,
      pricing: feedback.pricing != null ? String(feedback.pricing) : null,
      shipping: feedback.shipping != null ? String(feedback.shipping) : null,
      comment: feedback.comment ?? null,
      submit: false
    };
    this.hasExistingFeedback = !!(
      this.feedForm.quality &&
      this.feedForm.pricing &&
      this.feedForm.shipping
    );
  }

  isStarFilled(rowKey: string, optionIndex: number): boolean {
    const selectedValue = this.feedForm?.[rowKey];
    if (selectedValue == null || selectedValue === '') return false;
    const selectedIndex = this.ratingOptions.findIndex(option => option.value === String(selectedValue));
    return selectedIndex >= 0 && optionIndex <= selectedIndex;
  }

  resetForm(): void {
    this.feedForm = { quality: null, pricing: null, shipping: null, comment: null };
  }

  onCancel(): void {
    this.resetForm();
    this.commonService.goBack();
  }

  onSubmit(): void {
    if (!this.feedForm.quality || !this.feedForm.pricing || !this.feedForm.shipping) {
      this.feedbackFailure = true;
      setTimeout(() => { this.feedbackFailure = false; }, 3000);
      return;
    }

    this.feedForm.submit = true;
    this.feedForm.store_id = this.commonService.store_id;
    this.api.FEEDBACK(this.feedForm).subscribe(result => {
      this.feedForm.submit = false;
      if (result.status) {
        this.feedbackSuccess = true;
        this.loadFeedback(false);
      } else {
        this.feedbackFailure = true;
        console.log('response', result);
      }
      setTimeout(() => {
        this.feedbackSuccess = false;
        this.feedbackFailure = false;
      }, 3000);
    }, () => {
      this.feedForm.submit = false;
      this.feedbackFailure = true;
      setTimeout(() => { this.feedbackFailure = false; }, 3000);
    });
  }
}
