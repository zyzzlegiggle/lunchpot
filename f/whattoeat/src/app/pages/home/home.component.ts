import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FoodData } from 'src/app/interfaces/food-data';
import { LocationData } from 'src/app/interfaces/location-data';
import { RestaurantData } from 'src/app/interfaces/restaurant-data';
import { ApiService } from 'src/app/services/api/api.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule]
})
export class HomeComponent  implements OnInit {
  selectedFood: FoodData = {name:'', imageLink:''};
  isLoading: boolean = false;
  foodSelected: boolean = false;
  location: LocationData = {
    country:'',
    city:'',
    latitude:'',
    longitude:''
  };
  restaurants: RestaurantData[] = [];

  constructor(private apiService: ApiService) { }

  ngOnInit() {}

  public async onClick() {
    try{
      if (this.isLoading) return;
  
      this.isLoading = true;

      this.location = await this.apiService.getLocation();
      
      const data = await this.apiService.getFood("jamal", this.location.city, this.location.country)
      this.selectedFood = data;
      
    } catch (e: any) {
      console.error(`Error on fetching food data:${e.message}`)
      this.selectedFood.name = "Error";
    } finally {
      this.isLoading = false;
      this.foodSelected = true;
    }
  } 

  resetButton() {
    this.resetState();
  }

  public async findRestaurants() {
    try {
      if (!this.foodSelected || !this.selectedFood.name || !this.location.latitude || !this.location.longitude) {
      return;
      }

      this.isLoading = true;

      this.restaurants = await this.apiService.getRestaurant(this.selectedFood.name, this.location.latitude, this.location.longitude);

      console.log(this.restaurants);
    } catch (e: any) {
      console.error(e.message);
      alert('Could not find restaurants. Please try again later.');
    } finally {
      this.isLoading = false;
    }


  }

  
  resetState() {
    this.foodSelected = false;
    this.restaurants = [];
    this.selectedFood = { name: '', imageLink: '' };
  }

}
