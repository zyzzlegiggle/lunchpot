import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { FoodData } from 'src/app/interfaces/food-data';
import { LocationData } from 'src/app/interfaces/location-data';
import { RestaurantData } from 'src/app/interfaces/restaurant-data';
import { ApiService } from 'src/app/services/api/api.service';
import { locationOutline, mapOutline, refreshOutline, restaurantOutline, star, starHalf, starOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/angular/standalone';
import { AccountComponent } from 'src/app/components/account/account.component';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, IonIcon, AccountComponent],
  
})
export class HomeComponent  implements OnInit, AfterViewInit {
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
  isLoggedIn: boolean = false;

  constructor(private apiService: ApiService) {
    addIcons({mapOutline, restaurantOutline, locationOutline, refreshOutline, starHalf, starOutline, star})
   }

  ngOnInit() {}

  async ngAfterViewInit() {
    this.location = await this.apiService.getLocation();
  }

  public async onClick() {
    try{
      if (this.isLoading) return;

      this.resetState();
  
      this.isLoading = true;
      const data: any = await this.apiService.getFood("jamal", this.location.city, this.location.country)
      this.selectedFood = data
      
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

  public async saveFood() {
    try {
      const foodName = this.selectedFood.name;
      await this.apiService.saveFood(foodName)
    } catch (e: any) {
      console.error(e.message)
    }
  }

  handleImageError(event: any): void {
    event.target.src = this.selectedFood.imageLink;
  }

  isLoggedInCheck(isLogin: boolean) {
    this.isLoggedIn = isLogin;
    console.log(this.isLoggedIn);
  }

  
  resetState() {
    this.foodSelected = false;
    this.restaurants = [];
    this.selectedFood = { name: '', imageLink: '' };
  }



}
