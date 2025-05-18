import { Injectable } from '@angular/core';
import { FoodData } from 'src/app/interfaces/food-data';
import { LocationData } from 'src/app/interfaces/location-data';
import { LoginData } from 'src/app/interfaces/login-data';
import { RestaurantData } from 'src/app/interfaces/restaurant-data';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  
  constructor() { }

  public async getFood(username:string, city:string, country: string) {
    try {
      const body = {
        "location": {
          "country": country,
          "city": city
        },
        "username": username
      }
      console.log(body);
      const output = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      if (!output.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await output.json();
      const foodData: FoodData =  {
        name: data.food,
        imageLink: data.imageLink
      }
      return foodData

    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  public async getLocation(): Promise<LocationData> {
    try {
      const countryData = await fetch(environment.countryApi).then(response => response.json())
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
      const restaurantData: any = await fetch(`${this.apiUrl}/restaurants`, {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(body)
      }).then(response => response.json());
      const restaurants: RestaurantData[] = []
      console.log(restaurantData);
      restaurantData.places.forEach((data: any) => {
        restaurants.push({name: data.displayName.text, address: data.formattedAddress, 
          placeId: data.id, photoLink: data.photoLink});
      })
      return restaurants;
    } catch (e: any) {
      throw new Error(e.message)
    }
  }

  
}


