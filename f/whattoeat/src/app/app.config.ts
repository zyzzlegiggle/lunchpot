import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import { ApplicationConfig } from "@angular/core";
import { authInterceptor } from "./services/auth/auth.interceptor";
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from "./app.routes";


      

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withFetch(),withInterceptors([authInterceptor])),
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideIonicAngular(),
        provideRouter(routes, withPreloading(PreloadAllModules)),
    ]
}




    