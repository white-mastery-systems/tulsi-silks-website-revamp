import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserModelsComponent } from './user-models.component';

describe('UserModelsComponent', () => {
  let component: UserModelsComponent;
  let fixture: ComponentFixture<UserModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserModelsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
