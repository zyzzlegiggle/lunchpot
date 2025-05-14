import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'whattoeat';

  food: string='';
  latitude: string='';
  longitude:string='';
  country:string='';
  city:string='';

  public async onClick() {
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
    this.food = data.food;
    


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
