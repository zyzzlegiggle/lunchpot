import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule]
})
export class HomeComponent  implements OnInit {
  selectedFood: {name: string, image: string} = {name: '', image: ''};
  isLoading: boolean = false;
  foodSelected: boolean = false;
  latitude: string='';
  longitude:string='';
  country:string='';
  city:string='';

  constructor() { }

  ngOnInit() {}

  public async onClick() {
    try{
      if (this.isLoading) return;
  
      this.isLoading = true;

      const position = await this.getCurrentPosition();
      this.latitude = position.coords.latitude.toString();
      this.longitude = position.coords.longitude.toString();
      await fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
          this.country = data.country_name;
          this.city = data.city;
        })
        .catch(error => {
          console.error("Error fetching geolocation:", error);
      });

      const body = {
        "location": {
          "country": this.country,
          "city": this.city,
          "latitude": this.latitude,
          "longitude": this.longitude
        },
        "username": "jamal"
      }
      console.log(body);
      
      const output = await fetch(`http://localhost:3000/`, {
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
      this.selectedFood.name = data.food;
      console.log(this.selectedFood.name);
      

    } catch (e: any) {
      console.error(`Error on fetching food data:${e.message}`)
      this.selectedFood.name = "Error";
    } finally {
      this.isLoading = false;
      this.foodSelected = true;
    }
  } 
  resetButton() {
    this.foodSelected = false;
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

}
