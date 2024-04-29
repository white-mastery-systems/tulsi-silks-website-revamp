import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicePlacedComponent } from './service-placed.component';

describe('ServicePlacedComponent', () => {
  let component: ServicePlacedComponent;
  let fixture: ComponentFixture<ServicePlacedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServicePlacedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlacedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
