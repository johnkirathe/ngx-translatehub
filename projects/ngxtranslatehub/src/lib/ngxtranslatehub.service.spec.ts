import { TestBed } from '@angular/core/testing';

import { NgxtranslatehubService } from './ngxtranslatehub.service';

describe('NgxtranslatehubService', () => {
  let service: NgxtranslatehubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxtranslatehubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
