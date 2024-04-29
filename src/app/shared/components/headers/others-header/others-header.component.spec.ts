import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OthersHeaderComponent } from './others-header.component';

describe('OthersHeaderComponent', () => {
  let component: OthersHeaderComponent;
  let fixture: ComponentFixture<OthersHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OthersHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OthersHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
