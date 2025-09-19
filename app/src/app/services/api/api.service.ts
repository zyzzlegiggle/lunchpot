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
import { firstValueFrom } from 'rxjs';

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
          
          const foodData: FoodData =  {
            name: body.food,
            imageLink: body.imageLink
          }
          
          this.localService.setItem('anonId', body.anonId);
          resolve(foodData);
        } else {
          console.warn(`Unexpected status code: ${statusCode}`);
          
        }
      },
      error: (error: any) => {
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
      // Start the country API request immediately
      const countryReq = firstValueFrom(
        this.http.get(environment.countryApi)
      ).catch((err) => {
        // swallow country API errors and return a sensible default
        console.warn('country API failed:', err);
        return { country_name: '', city: '' };
      });

      // Start geolocation retrieval
      const geolocationPromise = this.getCurrentPosition();

      // Await both in parallel for better performance
      const [countryData, geolocationData] = await Promise.all([
        countryReq,
        geolocationPromise,
      ]);

      // Normalize types and guard against missing fields
      const countryName = (countryData as any)?.country_name ?? '';
      const cityName = (countryData as any)?.city ?? '';

      return {
        country: countryName,
        city: cityName,
        latitude: geolocationData.coords.latitude.toString(),
        longitude: geolocationData.coords.longitude.toString(),
      };
    } catch (e: any) {
      // Provide a clear message for the caller
      console.error('getLocation error:', e);
      throw new Error('Unable to get location. Please enable location services and grant permission.');
    }
  }

  private async getCurrentPosition(): Promise<GeolocationPosition> {
      // Try Capacitor Geolocation first (works on mobile)
      try {
        if ((Geolocation as any) && typeof (Geolocation as any).getCurrentPosition === 'function') {
          // Capacitor returns an object compatible with GeolocationPosition-like shape,
          // but to be safe we cast it.
          const capPos = await Geolocation.getCurrentPosition();
          // capPos has coords.latitude / coords.longitude etc.
          return capPos as unknown as GeolocationPosition;
        }
      } catch (err) {
        console.warn('Capacitor Geolocation failed or permission denied:', err);
        // continue to try browser fallback
      }

      // Browser fallback
      return await new Promise<GeolocationPosition>((resolve, reject) => {
        if (navigator && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(err),
            // options: try to be responsive but allow cached position
            { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
          );
        } else {
          reject(new Error('Geolocation not supported by this device/browser'));
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

      return new Promise<RestaurantData[]>((resolve, reject) => {
      this.http.post(`${this.apiUrl}/restaurants`, JSON.stringify(body), {
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
          
      restaurantData = body;

      const restaurants: RestaurantData[] = []
      
      restaurantData.places.forEach((data: any) => {
        
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
      resolve(restaurants);
        } else {
          console.warn(`Unexpected status code: ${statusCode}`);
          
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
    })

      

    } catch (e: any) {
      throw new Error(e.message)
    }
    
  }

  public async saveFood(food:string) {
    try {
      
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
          
          resolve(body)
        } else {
          console.warn(`Unexpected status code: ${statusCode}`);
          
        }
      },
      error: (error: any) => {
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
          
        }
      },
      error: (error: any) => {
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


