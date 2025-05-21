import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LoginData } from 'src/app/interfaces/login-data';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { SignupData } from 'src/app/interfaces/signup-data';
import { USE_AUTH } from './auth.interceptor';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  constructor(private localService: LocalStorageService) { }
  
  public async login(loginData: LoginData) {
    const body = {
        email: loginData.email,
        password: loginData.password
    };

      

      return new Promise((resolve, reject) => {
        this.http.post<any>(`${this.apiUrl}/login`, body)
        .subscribe({
          next: (response) => {
            
            console.log(response);
            this.localService.setItem('token', response.token);
            resolve({username: response.user.username});

          },
          error: (err) => {
            reject(err);
          }
        })
      })
  }

  public async signup(signupData: SignupData): Promise<void> {
    const body = {
        username: signupData.username,
        email: signupData.email,
        password: signupData.password
    };

      

      return new Promise((resolve, reject) => {
        this.http.post<any>(`${this.apiUrl}/register`, body)
        .subscribe({
          next: (response) => {
            
            console.log(response);
            resolve();

          },
          error: (err) => {
            reject(err);
          }
        })
      })
  }

  public async checkUser() {
  try {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.apiUrl}/user`, {
      context: new HttpContext().set(USE_AUTH, true),
      observe: 'response'
    }).subscribe({
      next: (response: HttpResponse<any>) => {
        const statusCode = response.status;
        const body = response.body;

        if (statusCode === 200) {
          console.log('User check successful', body.user.username);
          resolve(body)
        } else {
          console.warn(`Unexpected status code: ${statusCode}`);
          console.log(body);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
    })
  } catch (e: any) {
    throw new Error(e.message);
  }
}

}
