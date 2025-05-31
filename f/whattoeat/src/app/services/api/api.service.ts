import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FoodData } from 'src/app/interfaces/food-data';
import { LocationData } from 'src/app/interfaces/location-data';
import { LoginData } from 'src/app/interfaces/login-data';
import { RestaurantData } from 'src/app/interfaces/restaurant-data';
import { environment } from 'src/environments/environment';
import { USE_AUTH } from '../auth/auth.interceptor';
import { Geolocation } from '@capacitor/geolocation';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  constructor(private localService: LocalStorageService) { }

  public async getFood(city:string, country: string) {
    try {
      let anonId = '';
      try {
        anonId = this.localService.getItem('anonId') || '';
      } catch (e) {
        console.warn('anonId not found in localService:', e);
        anonId = '';
      }
      const body = {
        "location": {
          "country": country,
          "city": city
        },
        anonId: anonId
      }
      
      return new Promise((resolve, reject) => {
      this.http.post(`${this.apiUrl}`, JSON.stringify(body), {
      context: new HttpContext().set(USE_AUTH, true),
      observe: 'response',
      headers: {
          "Content-Type": "application/json"
        },
      withCredentials: true
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
          this.localService.setItem('anonId', body.anonId);
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
      console.log('getlocation triggered')
      let countryData = {country_name : '', city: ''};
      this.http.get(environment.countryApi).subscribe({
        next: (data: any) => {
          countryData = data;
        }
      })
      console.log(countryData);
      const geolocationData = await Geolocation.getCurrentPosition();
      console.log(`location fetched ${geolocationData.coords.latitude.toString()}, ${geolocationData.coords.longitude.toString()}`)
      return {
        country: countryData.country_name,
        city: countryData.city,
        latitude: geolocationData.coords.latitude.toString(),
        longitude: geolocationData.coords.longitude.toString()

      }
    } catch (e: any) {
      throw new Error("Turn on your location services")
    }
  }

  // uses web API (doesnt work in capacitor)
  private async getCurrentPosition(): Promise<GeolocationPosition> {
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

      console.log(response)

      restaurantData = await response.json()

      const restaurants: RestaurantData[] = []
      console.log(restaurantData)
      restaurantData.places.forEach((data: any) => {
        console.log(data)
        restaurants.push({
          name: data.displayName.text,
          address: data.formattedAddress, 
          placeId: data.id, 
          photoLink: data.photoLink,
          rating: data.rating,
          priceRange: {
            startPrice: {
              currencyCode: data.priceRange?.startPrice.currencyCode,
              units: data.priceRange?.startPrice.units
            },
            endPrice: {
              currencyCode: data.priceRange?.endPrice.currencyCode,
              units: data.priceRange?.endPrice.units
            }
          }
        });
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
        },
      withCredentials: true
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

  public async getSavedFood() {
    try {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.apiUrl}/saved-food`, {
      context: new HttpContext().set(USE_AUTH, true),
      observe: 'response',
      withCredentials: true
    }).subscribe({
      next: (response: HttpResponse<any>) => {
        const statusCode = response.status;
        const body = response.body;

        if (statusCode === 200) {
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

  public async deleteFood(foodName: string) {
    try {
      const body = {
        'foodName': foodName
      };
    return new Promise((resolve, reject) => {
      console.log(foodName)
      
      this.http.post(`${this.apiUrl}/delete-food`, JSON.stringify(body), {
      context: new HttpContext().set(USE_AUTH, true),
      observe: 'response',
      headers: {
          "Content-Type": "application/json"
        },
      withCredentials: true
    }).subscribe({
      next: (response: HttpResponse<any>) => {
        const statusCode = response.status;
        const body = response.body;

        if (statusCode === 200) {
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


