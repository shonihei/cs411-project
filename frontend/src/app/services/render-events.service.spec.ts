import { TestBed } from '@angular/core/testing';

import { RenderEventsService } from './render-events.service';

describe('RenderEventsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RenderEventsService = TestBed.get(RenderEventsService);
    expect(service).toBeTruthy();
  });
});
