import { Injectable } from '@angular/core';
import { LoginData } from 'src/app/interfaces/login-data';
import { SignupData } from 'src/app/interfaces/signup-data';

@Injectable({
  providedIn: 'root'
})
export class AccountValidatorService {

  constructor() { }

  private validateEmail(email: string) {
    
    if(email.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)){
      return;
    }

    throw new Error('Invalid Email');
  }

  private validatePassword(password: string) {
    const minLength = 8;
    const hasUppercase = /[A-Z]/;
    const hasNumber = /[0-9]/;

    if (
      password.length >= minLength &&
      hasUppercase.test(password) &&
      hasNumber.test(password)
    ) {
      return;
    }

    throw new Error(`Invalid password.
      \n- Must be at least 8 characters long
      \n- Has at least 1 uppercase letter
      \n- Has at least 1 number`)
  }

  private validateUsername(username: string) {
    const minLength = 8;
    if (username.length >= minLength) return true;
    throw new Error(`Invalid username. Must be at least 8 characters long`);
  }

  public loginCheck(loginData: LoginData) {
    try {
      this.validateEmail(loginData.email);
      this.validatePassword(loginData.password);  
    } catch(e: any) {
      throw new Error(e.message);
    }
    
  }

  public signupCheck(signupData: SignupData) {
    try {
      this.validateEmail(signupData.email);
      this.validatePassword(signupData.password);
      this.validateUsername(signupData.username);
      
    } catch (e:any) {
      throw new Error(e.message);
    }
  }
}
