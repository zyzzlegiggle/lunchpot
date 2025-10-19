Here’s a cleaner, professional rewrite of your **LunchPot** README — with all emojis and “corny AI” phrasing removed, while keeping it clear, engaging, and developer-friendly:

---

# LunchPot

**LunchPot** helps you decide what to eat by suggesting dishes, finding nearby restaurants, and allowing you to save your favorites for future recommendations.

---

## Live Demo

Try it here: **[LunchPot Live](https://lunchpot.site)**

---

## Project Structure

* **app/** — Built with **Angular**, **Ionic**, and **Capacitor**.
* **server/** — Uses **Express.js**, **LangChain (Gemini)**, **Google Places API**, and **Google Search API** for restaurant data and images.

---

## Features

* Random food recommendations for quick decisions.
* Nearby restaurant finder using Google Places.
* Save favorite foods for personalized suggestions.
* Automatically fetched food images from Google Search.

---

## Tech Stack

### App (Frontend)

* Angular
* Ionic
* Capacitor
* Firebase Hosting

### Server (Backend)

* Express.js
* LangChain (Gemini)
* Google Places API
* Google Search API
* Deployed on **Google Cloud Run**

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/lunchpot.git
cd lunchpot
```

### 2. Run the server

```bash
cd server
npm install
npm run dev
```

Server runs on: `http://localhost:8080`

### 3. Run the app

```bash
cd ../app
npm install
ionic serve
```

App runs on: `http://localhost:8100`

---

## Deployment

**Server** — Google Cloud Run

```bash
gcloud run deploy
```

**App** — Firebase Hosting

```bash
firebase deploy
```

---

## Download

You can download the latest build from **[GitHub Releases](https://github.com/zyzzlegiggle/lunchpot/releases)**.

---

