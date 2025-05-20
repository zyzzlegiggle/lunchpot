import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  storedKeys = ['token']
  
  constructor() { }

  public setItem(key: string, value: any){
    key = key.toLowerCase();
    if (!this.storedKeys.includes(key)) {
      throw new Error(`Local storage key does not exist`);
    }
    localStorage.setItem(key, value);
  }

  public getItem(key: string) {
    key = key.toLowerCase();
    if (!this.storedKeys.includes(key)) {
      throw new Error(`Local storage key does not exist`);
    }
    return localStorage.getItem(key);
  }

  public removeItem(key: string) {
    key = key.toLowerCase();
    if (!this.storedKeys.includes(key)) {
      throw new Error(`Local storage key does not exist`);
    }
    return localStorage.removeItem(key);
  }
}
