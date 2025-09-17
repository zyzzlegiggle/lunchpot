import { Component, Optional } from '@angular/core';
import { App } from '@capacitor/app';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent {
  constructor(
    private platform: Platform
  ) {
      this.platform.backButton.subscribeWithPriority(-1, () => {
      App.exitApp();
    });
  }
}
