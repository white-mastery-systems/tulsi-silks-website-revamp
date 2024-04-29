import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SizingAssistantComponent } from './sizing-assistant.component';

describe('SizingAssistantComponent', () => {
  let component: SizingAssistantComponent;
  let fixture: ComponentFixture<SizingAssistantComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SizingAssistantComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SizingAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
