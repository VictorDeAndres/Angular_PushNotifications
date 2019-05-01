import { Component, OnInit } from '@angular/core';
import { WebPushNotificationsService } from './services/web-push-notifications.service';
@Component({
  selector: 'ang-pn-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-push-notifications';

  constructor (
    private webPushNotificationsService: WebPushNotificationsService
  ) { }

  ngOnInit() {
    this.webPushNotificationsService.requestPermission();
  }
}