import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickOrderDetailsComponent } from './quick-order-details.component';

describe('QuickOrderDetailsComponent', () => {
  let component: QuickOrderDetailsComponent;
  let fixture: ComponentFixture<QuickOrderDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickOrderDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickOrderDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
