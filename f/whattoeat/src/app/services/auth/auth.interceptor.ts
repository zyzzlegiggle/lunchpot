import { HttpHandlerFn } from "@angular/common/http";
import { HttpEvent, HttpRequest } from "@angular/common/module.d-CnjH8Dlt";
import { Observable } from "rxjs";

      

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {  
    const token = localStorage.getItem('token');

    // Clone the request to add the authentication header.
    if (token) {
        const newReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        })
        return next(newReq);
    }

    return next(req);
}



    