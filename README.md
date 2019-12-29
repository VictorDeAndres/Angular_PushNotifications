Esta es una copia del artículo [Tutorial implementación de notificaciones push en Angular](https://victordeandres.es/post/angular-push-notifications) publicado en mi [blog](https://victordeandres.es) 

# Tutorial implementación de notificaciones push en Angular

Estamos acostumbrados a recibir notificaciones de nuestro calendario, correo, ect, … tanto en nuestros smartphones, como en nuestros ordenadores. En este post veremos cómo implementar esta tecnología en una página web desarrollada con Angular.

Este post se va a dividir en dos partes. En esta primera parte desarrollaremos una página web con angular que incluirá la posibilidad de recibir notificaciones push, y en la segunda parte desarrollaremos un servidor web que será el encargado de emitir las notificaciones.

## Comencemos.
Antes de comenzar con este nuevo proyecto debemos conocer la clave pública con la cual nos conectaremos a nuestro servidor de notificaciones. Cómo obtener esta clave pública lo veremos en el siguiente artículo, dedicado a la parte del servidor. O desde la siguiente página web, puedes generar tus claves. Una vez tengamos nuestra clave podremos comenzar con el desarrollo de nuestro cliente web.

## Cliente Web.
Lo primero que haremos, como es habitual en un proyecto angular será crear nuestro nuevo proyecto.

```bash
ng new angular-push-notifications --prefix ang-pn
```

Una vez hemos creado nuestro proyecto el primer paso que vamos a realizar es crear un servicio para encapsular nuestro código.

```bash
ng genarate service ./services/webPushNotifications
```

## Inicialización del servicio.

Lo primero que deberemos será definir el constructor de nuestro servicio y inicializar las variables que vamos a utilizar en el servicio.

```typescript
private _swRegistration;
private _isSubscribed: boolean;
private applicationServerPublicKey: string;

constructor ( private httpClient: HttpClient ) {
    this.applicationServerPublicKey = 'nuestra clave privada';
}  
```

## Chequeo web browser.

En este servicio crearemos los siguientes métodos:

```typescript
private checkServiceWorkerPushEnabled(): boolean { 
    return ('serviceWorker' in navigator && 'PushManager' in window);
}
```

Este primer método nos devolverá un valor booleano indicando si el navegador web que está utilizando el cliente soporta la funcionalidades Service Workers y Notificaciones Push.

Si el navegador de nuestro cliente soporta ambas funcionalidades el siguiente paso que debemos realizar es registrar nuestro Service Worker.

```typescript
private enableServiceWorker(): void {
    navigator.serviceWorker.register('/app/serviceWorker/sw.js', {scope: '/app/serviceWorker/'})
        .then( swReg => {
            console.info('Service Worker esta registrado', swReg);
            this.swRegistration = swReg;
            this.initialiseUI();
    })
    .catch(function(error) {
        console.error('Service Worker Error', error);
    });
}
```
Veamos en detalle esta función.

Lo primero que realizamos es registrar el fichero sw.js, que en este ejemplo he ubicado en la carpeta ‘/app/serviceWorker/’ del proyecto y que será donde se encuentre la lógica de nuestro Service Worker. Este fichero lo escribiremos posteriormente.

Una vez registrado con éxito nuestros fichero procederemos a llamar a a la función initialiseUI en la cual verificaremos si el usuario nos ha habilitado para enviarle notificaciones en cuyo caso estableceremos la comunicación con el servidor, o en caso contrario le pediremos permiso para enviarle notificaciones.

```typescript
private initialiseUI(): void {
this.swRegistration.pushManager.getSubscription()
    .then( subscription => {
        this.isSubscribed = !(subscription === null); 
        if (this.isSubscribed) { 
            this.sendSubcriptionObject(subscription);
        } else {
            console.log('Usuario NO esta registrado');
            this.subscribeUser();
        } 
    });
}  

```
Como he comentado anteriormente en esta función chequeamos si el usuario ya nos dio permiso para enviarle notificaciones y estableceremos la conexión con el servidor, para ello invocamos a la función sendSubcriptionObject o solicitaremos permiso al usuario, función subscribeUser para poder enviarle notificaciones.

## Solicitar permiso al usuario.

Con esta función solicitaremos permiso al usuario para enviarle notificaciones. Si el usuario nos da permiso para enviarle notificaciones el siguiente paso que deberemos dar será establecer la comunicación entre el cliente y el servidor.

```typescript
private subscribeUser(): void {
    const applicationServerKey = this.urlB64ToUint8Array(this.applicationServerPublicKey);             
    this.swRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey }) .then(function(subscription) {             
        console.log('Usuario suscrito: ', subscription);
        this.isSubscribed = true;
    })
    .catch(function(err) {
        console.log('Fallo al realizar la suscripción: ', err);
    });
} 
```
 
Antes de comenzar deberemos convertir la clave pública con la cual debemos conectarnos al servidor al formato UInt8Array, que es el formato esperado por llamada de la suscripción.

A continuación llamamos a subscribe que es una promesa que se resolverá correctamente si el usuario nos otorga permiso para recibir notificaciones y el navegador a enviado una solicitud a un servicio push, o en caso contrario mostraremos un mensaje de log por la consola.

## Notificación al servidor.

Una vez obtenido el permiso para recibir las notificaciones, o en caso de tener ya permiso para recibirlas enviaremos al servidor la información necesaria para recibir las notificaciones. Para ello llamaremos a nuestra última función sendSubcriptionObject.

```typescript
private sendSubcriptionObject(subscription): void {
    const apiUrl = `${environment.apiRoot}/subscribe`;
    this.httpClient.post(apiUrl, subscription).subscribe();
}  
```

Esta función enviará a nuestro servidor el objeto subcription que entre otra información lleva almacenado el endpoint de nuestro dispositivo que posteriormente necesitaremos para enviar las notificaciones.

* Nota: En esta parte del ejemplo deberemos comentar esta parte del código ya que aún no hemos desarrollado nuestro servidor de notificaciones. O indicar la ruta de nuestro servidor de notificaciones.*

## Las notificaciones.

Una vez hemos desarrollado la conexión con nuestro servidor, el siguiente paso que vamos a realizar es el tratamiento de las notificaciones. Al principio del artículo al comienzo del desarrollo escribimos el siguiente código.

```typescript
... 
navigator.serviceWorker.register('app/serviceWorker/sw.js', {scope: '/app/serviceWorker/'}) .then( swReg => { 
...  
```
En este código registramos el fichero sw.js que es el fichero donde se vamos a escribir el listener de las notificaciones enviadas desde el servidor.

```javascript
'use strict';

self.addEventListener('push', function(event) { 
    const title = 'Comunicacion Ejemplo Push Notificaction';
    const options = { 
        body: event.data.text()
    };        
    event.waitUntil(self.registration.showNotification(title, options));
}); 
```
## Compilación.

Si ahora construimos nuestra aplicación web y la ejecutamos obtendremos un error similar al siguiente:

A bad HTTP response code (404) was received when fetching the script.

Error Service Worker TypeError: Failed to register a ServiceWorker: A bad HTTP response code (404) was received when fetching the script.

Esto es debido a que al realizar la construcción de nuestra aplicación todo el código de la misma se une en un único fichero. Por ello al intentar registrar el listener de las notificaciones el sistema no encontrará ese fichero.

Para excluir este fichero de nuestro proceso de construcción simplemente deberemos ir nuestro fichero de configuración del proyecto y añadir la siguiente línea.

```bash
...
"assets": [
    "src/favicon.ico",
    "src/assets",
    "src/app/serviceWorker"
],
...
```  
De esta manera al construir nuestro proyecto no se incluirá nuestro listener y nuestro desarrollo funcionará correctamente.

### La prueba.

Una vez ya hemos corregido el error de registro y hemos ejecutado nuestra página web sin problema es tiempo de enviar una notificación para comprobar que nuestra aplicación funciona correctamente.

Dado que aún no hemos creado nuestro propio servidor de notificaciones vamos a hacer la prueba desde la consola de depuración de nuestro navegador. Yo normalmente trabajo con Chrome, así que los pasos que voy a indicar son los necesarios para para este navegador.

Lo primero es acceder a la opción Application de la barra de opciones y seleccionar la opción “Service Workers” de las opciones del menú de Application. Esto nos mostrará una pantalla similar a la siguiente:

[Test notificación push](http://victordeandres.esassets/images/posts/test_angular_push_notifications.png)

Si pulsamos el botón push enviaremos el mensaje a nuestra aplicación web, la cual hemos habilitado para recibir notificaciones push. Si todo funciona correctamente veremos una notificación con el mensaje que hayamos enviado.

### Punto y aparte.
Hasta aquí la primera parte de este artículo donde hemos visto cómo desarrollar nuestro cliente con notificaciones push con Angular.

