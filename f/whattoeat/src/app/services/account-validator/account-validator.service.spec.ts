import { TestBed } from '@angular/core/testing';

import { AccountValidatorService } from './account-validator.service';

describe('AccountValidatorService', () => {
  let service: AccountValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
