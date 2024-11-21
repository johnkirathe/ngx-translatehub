import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxtranslatehubComponent } from './ngxtranslatehub.component';

describe('NgxtranslatehubComponent', () => {
  let component: NgxtranslatehubComponent;
  let fixture: ComponentFixture<NgxtranslatehubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxtranslatehubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxtranslatehubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
