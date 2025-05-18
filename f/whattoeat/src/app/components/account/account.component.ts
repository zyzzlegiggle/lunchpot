import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookmarkOutline, chevronDownOutline, logoGoogle, logOutOutline, personOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  imports: [IonIcon, CommonModule]
})
export class AccountComponent  implements OnInit {
  isLoggedIn: boolean = false;
  userName: string='';
  userPhotoUrl: string = '';
  showUserMenu: boolean=false;
  @Output() isLoggedInEvent = new EventEmitter<boolean>();

  constructor() { 
    addIcons({chevronDownOutline, personOutline, bookmarkOutline, settingsOutline, logOutOutline})
  }

  ngOnInit() {
    this.isLoggedInEvent.emit(this.isLoggedIn);
  }

  
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }


}
