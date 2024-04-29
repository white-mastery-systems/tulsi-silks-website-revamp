import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryMethodsComponent } from './delivery-methods.component';

describe('DeliveryMethodsComponent', () => {
  let component: DeliveryMethodsComponent;
  let fixture: ComponentFixture<DeliveryMethodsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeliveryMethodsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryMethodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
