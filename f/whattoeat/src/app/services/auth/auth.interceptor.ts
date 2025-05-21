import { HttpContextToken, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

      
export const USE_AUTH = new HttpContextToken(() => false);

export function authInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {  
    const token = localStorage.getItem('token');
    console.log(token);

    const useAuth = req.context.get(USE_AUTH);

    // Clone the request to add the authentication header.
    if (token && useAuth) {
        console.log("use auth")
        const newReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        })
        return next(newReq);
    }

    return next(req); // without token
}



    