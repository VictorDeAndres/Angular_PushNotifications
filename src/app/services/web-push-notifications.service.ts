import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class WebPushNotificationsService {

  private _swRegistration;
  private _isSubscribed: boolean;

  private applicationServerPublicKey: string;

  constructor(
    private httpClient: HttpClient
  ) {
    this.applicationServerPublicKey = 'BFnkgJn7fflANKc9J0bOIeYHgO8lUWIuPBuhWWNFzDXsr_rUSP36SamYzhwuckxel9jYhA0-LypN4gz3e7Gq-0M';
  }


  /**
   * requestPermission
   *
   * Solicitar permiso para mostrar las notificaciones web.
   * @returns boolean
   */
  public requestPermission() {
    if ( this.checkServiceWorkerPushEnabled() ) {
      this.enableServiceWorker();
    } else {
      console.warn('Las notificaciones web no están soportadas por el navegador');
    }
  }


  /**
   * checkServiceWorkerPushEnabled
   *
   * Comprueba si el navagador soporta la funcionalidad de serviceWorkers y notificaciones web.
   * @returns boolean
   */
  private checkServiceWorkerPushEnabled(): boolean {
    return ('serviceWorker' in navigator && 'PushManager' in window);
  }


  /**
   * enableServiceWorker
   *
   * Habilita el service worker para recibir las notificaciones.
   */
  private enableServiceWorker(): void {
    navigator.serviceWorker.register('app/serviceWorker/sw.js', {scope: '/app/serviceWorker/'})
    .then( swReg => {
      console.log('Service Worker esta registrado', swReg);
      this._swRegistration = swReg;
      this.initialiseUI();
    })
    .catch(function(error) {
      console.error('Error Service Worker', error);
    });
  }


  /**
  * initialiseUI
  *
  * Check if user allow web notifications or asked to user to allow it
  * @returns void
  */
  private initialiseUI(): void {
    // Set the initial subscription value
    this._swRegistration.pushManager.getSubscription()
    .then( subscription => {
      this._isSubscribed = !(subscription === null);

      if (this._isSubscribed) {
        this.sendSubcriptionObject(subscription);
      } else {
        console.log('Usuario NO esta registrado');
        this.subscribeUser();
      }
    });
  }


  /**
  * sendSubcriptionObject
  *
  * Send subscription object to backend to send notifications to customer
  * @param {} subscription
  * @returns void
  */
  private sendSubcriptionObject(subscription): void {
    const apiUrl = `${environment.apiRoot}/subscribe`;
    this.httpClient.post(apiUrl, subscription).subscribe();
  }


  /**
  * subscribeUser
  *
  * Create subscription object
  * @returns void
  */
  private subscribeUser(): void {
    const applicationServerKey = this.urlB64ToUint8Array(this.applicationServerPublicKey);
    this._swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      })
      .then( (subscription) => {
        console.log('Usuario suscritó: ', subscription);
        this.sendSubcriptionObject(subscription);
        this._isSubscribed = true;
      })
      .catch(function(err) {
        console.log('Fallo al realizar la subcripción: ', err);
      }
    );
  }


  /**
  * urlB64ToUint8Array
  *
  * Convierto la clave pública del servidor a un UintArray
  * @param {} base64String
  * @returns Uint8Array
  */
  private urlB64ToUint8Array(base64String): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
