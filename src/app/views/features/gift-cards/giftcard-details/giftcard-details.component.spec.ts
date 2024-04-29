import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiftcardDetailsComponent } from './giftcard-details.component';

describe('GiftcardDetailsComponent', () => {
  let component: GiftcardDetailsComponent;
  let fixture: ComponentFixture<GiftcardDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GiftcardDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GiftcardDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
