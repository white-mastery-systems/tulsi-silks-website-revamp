import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorEnquiryComponent } from './vendor-enquiry.component';

describe('VendorEnquiryComponent', () => {
  let component: VendorEnquiryComponent;
  let fixture: ComponentFixture<VendorEnquiryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorEnquiryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorEnquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
