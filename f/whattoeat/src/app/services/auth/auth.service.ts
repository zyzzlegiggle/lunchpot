import { Injectable } from '@angular/core';
import { LoginData } from 'src/app/interfaces/login-data';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  constructor() { }
  
  public async login(loginData: LoginData) {
    try {
      const body = {
        email: loginData.email,
        password: loginData.password
      };

      const response = await fetch(`${this.apiUrl}/login`, {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(body)
      })
      console.log(response);
    } catch (e: any) {
      throw new Error(e.message)
    }
  }
}
