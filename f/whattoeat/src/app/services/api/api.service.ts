import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FoodData } from 'src/app/interfaces/food-data';
import { LocationData } from 'src/app/interfaces/location-data';
import { LoginData } from 'src/app/interfaces/login-data';
import { RestaurantData } from 'src/app/interfaces/restaurant-data';
import { environment } from 'src/environments/environment';
import { USE_AUTH } from '../auth/auth.interceptor';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  constructor() { }

  public async getFood(username:string, city:string, country: string) {
    try {
      const body = {
        "location": {
          "country": country,
          "city": city
        }
      }
      
      return new Promise((resolve, reject) => {
      this.http.post(`${this.apiUrl}`, JSON.stringify(body), {
      context: new HttpContext().set(USE_AUTH, true),
      observe: 'response',
      headers: {
          "Content-Type": "application/json"
        }
    }).subscribe({
      next: (response: HttpResponse<any>) => {
        const statusCode = response.status;
        const body: any = response.body;

        if (statusCode === 200) {
          console.log('User check successful', body);
          const foodData: FoodData =  {
            name: body.food,
            imageLink: body.imageLink
          }
          console.log(foodData)
          resolve(foodData);
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

  public async getLocation(): Promise<LocationData> {
    try {
      let countryData = {country_name : '', city: ''};
      await this.http.get(environment.countryApi).subscribe({
        next: (data: any) => {
          countryData = data;
        }
      })
      console.log(countryData);
      const geolocationData = await this.getCurrentPosition();
      return {
        country: countryData.country_name,
        city: countryData.city,
        latitude: geolocationData.coords.latitude.toString(),
        longitude: geolocationData.coords.longitude.toString()

      }
    } catch (e: any) {
      throw new Error(e.message)
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  }

  public async getRestaurant(food:string, latitude:string, longitude:string) {
    try {
      const body = {
        location: {
          latitude: latitude,
          longitude: longitude
        },
        food: food
      };
      let restaurantData = {places: []};
      const response = await fetch(`${this.apiUrl}/restaurants`, {
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        method: "POST"
      })

      restaurantData = await response.json()

      const restaurants: RestaurantData[] = []
      restaurantData.places.forEach((data: any) => {
        restaurants.push({name: data.displayName.text, address: data.formattedAddress, 
          placeId: data.id, photoLink: data.photoLink});
      })
      return restaurants;
    } catch (e: any) {
      throw new Error(e.message)
    }
  }

  public async saveFood(food:string) {
    try {
      console.log(food)
      const body = {
        food: food
      }
    return new Promise((resolve, reject) => {
      this.http.post(`${this.apiUrl}/save-food`, JSON.stringify(body), {
      context: new HttpContext().set(USE_AUTH, true),
      observe: 'response',
      headers: {
          "Content-Type": "application/json"
        }
    }).subscribe({
      next: (response: HttpResponse<any>) => {
        const statusCode = response.status;
        const body = response.body;

        if (statusCode === 200) {
          console.log('User check successful', body);
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


