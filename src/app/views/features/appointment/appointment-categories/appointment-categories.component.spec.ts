import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentCategoriesComponent } from './appointment-categories.component';

describe('AppointmentCategoriesComponent', () => {
  let component: AppointmentCategoriesComponent;
  let fixture: ComponentFixture<AppointmentCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppointmentCategoriesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppointmentCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
