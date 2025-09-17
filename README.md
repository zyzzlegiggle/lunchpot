

# 🍴 LunchPot

Feeling hungry but can’t decide what to eat? 😋
**LunchPot** is here to help! With just a tap, it suggests tasty dishes, finds nearby restaurants, and even lets you save your favorites for future personalized recommendations.

## 🚀 Project Structure

* **📱 app/** → Built with **Angular**, **Ionic**, and **Capacitor**.
* **🌐 server/** → Powered by **Express.js** + **LangChain (Gemini)** + **Google Places API** + **Google Search API** for food photos.

## ✨ Features

* 🎲 **Random food recommendations** when you just can’t decide.
* 📍 **Nearby restaurant finder** using Google Places.
* ❤️ **Save foods you love** for personalized suggestions later.
* 🖼️ **Food photos** fetched automatically with Google Search.

## 🛠️ Tech Stack

### App (Frontend)

* Angular
* Ionic
* Capacitor
* Firebase Hosting 🚀

### Server (Backend)

* Express.js
* LangChain (Gemini)
* Google Places API
* Google Search API
* Deployed on **Google Cloud Run** ☁️

## 🏃 Running Locally

### 1️⃣ Clone the repo

```bash
git clone https://github.com/your-username/lunchpot.git
cd lunchpot
```

### 2️⃣ Run the server

```bash
cd server
npm install
npm run dev
```

By default, the server will run on `http://localhost:8080`.

### 3️⃣ Run the app

```bash
cd ../app
npm install
ionic serve
```

The app will be available at `http://localhost:8100`.

## 🌍 Deployment

* **Server** → Deployed to **Google Cloud Run**

  ```bash
  gcloud run deploy
  ```
* **App** → Deployed to **Firebase Hosting**

  ```bash
  firebase deploy
  ```

## 🎉 Why LunchPot?

Because choosing lunch should be fun, not stressful! 😎
Whether you’re craving something new or sticking to your go-to meals, **LunchPot’s got your back.**

---

🍔✨ *Made with love, food cravings, and a dash of AI.*

---
