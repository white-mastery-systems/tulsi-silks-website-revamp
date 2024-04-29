import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickupMethodsComponent } from './pickup-methods.component';

describe('PickupMethodsComponent', () => {
  let component: PickupMethodsComponent;
  let fixture: ComponentFixture<PickupMethodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PickupMethodsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PickupMethodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
