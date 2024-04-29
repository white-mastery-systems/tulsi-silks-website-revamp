import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-payment-failure',
  templateUrl: './payment-failure.component.html',
  styleUrls: ['./payment-failure.component.scss']
})

export class PaymentFailureComponent implements OnInit {

  params: any = {};
  template_setting: any = environment.template_setting;

  constructor(private activeRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe((params: Params) => {
      this.params = params;
    });
  }

}