import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { FoodData } from 'src/app/interfaces/food-data';
import { LocationData } from 'src/app/interfaces/location-data';
import { RestaurantData } from 'src/app/interfaces/restaurant-data';
import { ApiService } from 'src/app/services/api/api.service';
import { closeOutline, locationOutline, mapOutline, refreshOutline, restaurantOutline, save, star, starHalf, starOutline } from 'ionicons/icons';
import { IonAlert, IonContent, IonFooter, IonHeader, IonIcon } from '@ionic/angular/standalone';
import { AccountComponent } from 'src/app/components/account/account.component';
import { ToastService } from 'src/app/services/toast/toast.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, IonIcon, AccountComponent, IonContent, IonFooter],
  
})
export class HomeComponent  implements OnInit{
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
  savedFoods: FoodData[] = [];
  isModalOpen = false;
  savedFoodLoading = false;
  isDeleteModalOpen = false;
  foodToDelete: FoodData ={name:'', imageLink:''};
  isDeletingFood = false;


  constructor(
    private apiService: ApiService, 
    private toastService: ToastService,
    
  ) {
    addIcons({mapOutline, restaurantOutline, locationOutline, refreshOutline, starHalf, starOutline, star,closeOutline})
   }

  async ngOnInit() {
    // this.location = await this.apiService.getLocation();
  }

  public async onClick() {
    try{
      
      if (this.isLoading) return;
      
      this.resetState();

      this.isLoading = true;

      if (this.location.country === '') this.location = await this.apiService.getLocation();
      

      
  
      
      const data: any = await this.apiService.getFood(this.location.city, this.location.country)
      this.selectedFood = data
      this.foodSelected = true;
      this.isLoading = false;
      
    } catch (e: any) {
      this.toastService.createToastError("Please try again");
      console.error(e.message)
      this.resetState();
    }
  } 

  public async findRestaurants() {
    try {
      if (!this.foodSelected || !this.selectedFood.name || this.getRestaurant) {
      return;
      }

      if (this.location.country === '') this.location = await this.apiService.getLocation();

      this.isLoading = true;

      this.restaurants = await this.apiService.getRestaurant(this.selectedFood.name, this.location.latitude, this.location.longitude);

      
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
      const name = this.selectedFood.name;
      this.isLoading = true
      await this.apiService.saveFood(name)
      .then (async _ => {
        await this.toastService.createToastSuccess(`${name} is saved`);
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
    
  }

  async savedFoodCheck(value: boolean) {
     if (value) {
      this.savedFoodLoading = true;
      let savedFood: any = await this.apiService.getSavedFood();
      savedFood = savedFood.food|| [];
      
      if (savedFood.length >0) {
        savedFood.forEach((food: any) => {
          this.savedFoods.push({
            name: food.foodName,
            imageLink: food.imageLink
          })
          
        });
        
      }
      this.isModalOpen = true;
      this.savedFoodLoading = false;
      
      }
  }

  // Add method to close modal
  closeModal() {
    
    this.isModalOpen = false;
  }

  confirmDelete(food: any, event: Event) {
    event.stopPropagation(); // Prevent triggering the food item click
    this.foodToDelete = food;
    this.isDeleteModalOpen = true;
  }
    
  cancelDelete() {
    this.isDeleteModalOpen = false;
    this.foodToDelete = {name:'', imageLink:''}
    this.isDeletingFood = false;
  }

  async deleteFood() {
  if (!this.foodToDelete) return;
  
  this.isDeletingFood = true;
  
  try {
    
    // Replace this with your actual delete logic
    await this.apiService.deleteFood(this.foodToDelete.name);

    this.toastService.createToastSuccess(`${this.foodToDelete.name} removed.`);
    
    // Remove from local array
    this.savedFoods = this.savedFoods.filter(food => food.name !== this.foodToDelete.name);
    
    // Close modal
    this.cancelDelete();
    
  } catch (error) {
    console.error('Error deleting food:', error);
    // Handle error (show toast, etc.)
    this.toastService.createToastError('Error removing food. Please try again.')
  } finally {
    this.isDeletingFood = false;
  }
}

  chooseSavedFood(food: FoodData) {
    
    this.resetState();
    this.selectedFood = food;
    this.foodSelected = true;
    this.closeModal();
  }
  resetState() {
    this.foodSelected = false;
    this.restaurants = [];
    this.selectedFood = { name: '', imageLink: '' };
    this.getRestaurant = false;
    this.isLoading = false
  }



}
