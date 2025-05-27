import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { FoodData } from 'src/app/interfaces/food-data';
import { LocationData } from 'src/app/interfaces/location-data';
import { RestaurantData } from 'src/app/interfaces/restaurant-data';
import { ApiService } from 'src/app/services/api/api.service';
import { closeOutline, locationOutline, mapOutline, refreshOutline, restaurantOutline, star, starHalf, starOutline } from 'ionicons/icons';
import { IonAlert, IonIcon } from '@ionic/angular/standalone';
import { AccountComponent } from 'src/app/components/account/account.component';
import { ToastService } from 'src/app/services/toast/toast.service';
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
  getRestaurant: boolean = false;
  openLoginModal = false;
  savedFoodModal = false;
  savedFoods: any[] = [];
  isModalOpen = false;
  savedFoodLoading = false;


  constructor(
    private apiService: ApiService, 
    private toastService: ToastService
  ) {
    addIcons({mapOutline, restaurantOutline, locationOutline, refreshOutline, starHalf, starOutline, star,closeOutline})
   }

  ngOnInit() {}

  async ngAfterViewInit() {
    this.location = await this.apiService.getLocation();
  }

  public async onClick() {
    try{
      if (this.isLoading) return;

      if (!this.location.country) this.location = await this.apiService.getLocation();

      this.resetState();
  
      this.isLoading = true;
      const data: any = await this.apiService.getFood(this.location.city, this.location.country)
      this.selectedFood = data
      this.foodSelected = true;
      this.isLoading = false;
      
    } catch (e: any) {
      this.toastService.createToastError("Please try again");
      this.resetState();
    }
  } 

  resetButton() {
    this.resetState();
  }

  public async findRestaurants() {
    try {
      if (!this.foodSelected || !this.selectedFood.name || !this.location.latitude || !this.location.longitude || this.getRestaurant) {
      return;
      }

      this.isLoading = true;

      this.restaurants = await this.apiService.getRestaurant(this.selectedFood.name, this.location.latitude, this.location.longitude);

      console.log(this.restaurants);
      this.getRestaurant = true
    } catch (e: any) {
      console.error(e.message);
      alert('Could not find restaurants. Please try again later.');
    } finally {
      this.isLoading = false;
    }


  }

  public async saveFood() {
    try {
      if (!this.isLoggedIn) {
        this.openLoginModal = true;
        setTimeout(() => {
          this.openLoginModal = false;
        });
        return; // open login modal
      }
      const foodName = this.selectedFood.name;
      this.isLoading = true
      await this.apiService.saveFood(foodName)
      .then (async _ => {
        await this.toastService.createToastSuccess(`${foodName} is saved`);
        this.isLoading = false;
      })
      
    } catch (e: any) {
      console.error(e.message)
      await this.toastService.createToastError("Failed to save food, please try again.");
    }
  }

  handleImageError(event: any): void {
    event.target.src = this.selectedFood.imageLink;
  }

  isLoggedInCheck(isLogin: boolean) {
    this.isLoggedIn = isLogin;
    console.log(this.isLoggedIn);
  }

  async savedFoodCheck(value: boolean) {
     if (value) {
      this.savedFoodLoading = true;
      const savedFoods: any = await this.apiService.getSavedFood();
      this.savedFoods = savedFoods.food|| [];
      this.isModalOpen = true;
      this.savedFoodLoading = false;
      console.log(this.savedFoodLoading);
      }
  }

  // Add method to close modal
  closeModal() {
    this.isModalOpen = false;
  }
    
  resetState() {
    this.foodSelected = false;
    this.restaurants = [];
    this.selectedFood = { name: '', imageLink: '' };
    this.getRestaurant = false;
    this.isLoading = false
  }



}
