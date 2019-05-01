import { TestBed } from '@angular/core/testing';

import { WebPushNotificationsService } from './web-push-notifications.service';

describe('WebPushNotificationsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebPushNotificationsService = TestBed.get(WebPushNotificationsService);
    expect(service).toBeTruthy();
  });
});
