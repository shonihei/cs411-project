import { TestBed } from '@angular/core/testing';

import { MouseEmitterService } from './mouse-emitter.service';

describe('MouseEmitterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MouseEmitterService = TestBed.get(MouseEmitterService);
    expect(service).toBeTruthy();
  });
});
