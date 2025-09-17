let dotenv = require('dotenv').config()

const express = require('express');
const { default: helmet } = require('helmet');
const app = express()
const port = 8080
const cors = require('cors');
const { getFoodImage, getFoodHistory, run, validateLogin, validateSignup, saveFood } = require('./util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { FieldValue } = require('@google-cloud/firestore');
const firestore = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');

const cookieParser = require('cookie-parser');

const isProd = process.env.NODE_ENV === 'production';


// config
app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: [process.env.APP_URL, process.env.WEB_URL],
  credentials: true
}));
app.use(cookieParser());

// background cleanup (this run every 1 minute)
setInterval(async () => {

  console.log(eatSession);
  
  
  const now = Date.now();
  for (const [email, session] of eatSession.entries()) {
    if (now - session.lastFetch > 10 * 60 * 1000) {
      // Check if the email already exists
      // const userRef = db.collection('whattoeat_users').doc(email)
      // const snapshot = await userRef.get();
      // if (snapshot.exists) {
      //   saveFood(email, eatSession.get(email).lastRecommended)
      // }
      eatSession.delete(email); // remove if there is no activity after 10 minutes
      
    }
  }
}, 60 * 1000)

let eatSession = new Map(); // key: username, value: { foodDeclined: [], lastRecommended: "", lastFetch: Date }

const db = new firestore({
  projectId: process.env.GOOGLE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_JSON_KEY_PATH,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware for JWT validation
const verifyToken = (req, res, next) => {
  try {
    let token = req.headers['authorization'];
    
    token = token?.split(" ")[1]; // remove bearer
    
    if (!token) {
      
      throw new Error('Unauthorized')
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        throw new Error('Unauthorized')
      }
      req.user = decoded; // decoded = { email: 'something@example.com', iat: ..., exp: ... }
      next();
    });
  } catch (e) {
    console.error(e.message);
    throw new Error(e.message);
  }
};


// assign before get email
const assignAnonymousId = (req, res, next) => {
  let anonId = req.cookies?.anonId || req.body.anonId;
  
  if (!anonId) {
    anonId = uuidv4(); // Generate new UUID
    res.cookie('anonId', anonId, { 
      httpOnly: true, 
      secure: isProd, // HTTPS only in production
      sameSite: isProd ? 'Strict' : 'Lax',
      maxAge: 1 * 1 * 60 * 60 * 1000  // 1 hour
    });
  }

  req.anonId = anonId;
  next();
};

// middleware to get email from jwt validation (just for email purposes only)
const getEmail = (req, res, next) => {
  req.user = { email: 'anonymous' };
  let token = req.headers['authorization'];
  token = token?.split(" ")[1]; // remove 'Bearer'

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded?.email) {
      // leave as anonymous
      return next();
    }

    req.user = decoded; // valid token with email
    next();
  });
};



app.post('/', assignAnonymousId, getEmail, async (req, res) => {
  try {
    const location = req.body.location;
    
    const sessionKey = req.user?.email === 'anonymous' ? req.anonId : req.user.email;;
    const now = Date.now();

    if (!eatSession.has(sessionKey)) {
      eatSession.set(sessionKey, {
        foodDeclined: [],
        lastRecommended: "",
        lastFetch: now
      });
    } else {
      let session = eatSession.get(sessionKey);
      if (!session.foodDeclined.includes(session.lastRecommended.toLowerCase())) {
        if (session.foodDeclined.length >=20) session.foodDeclined.shift();
        session.foodDeclined.push(session.lastRecommended.toLowerCase());
      }
      session.lastFetch = now;
    }
    
    let foodHistory = await getFoodHistory(sessionKey)
    
  let sessionData = eatSession.get(sessionKey);
  let foodDeclined = sessionData.foodDeclined || []; // ensure array
  foodHistory = Array.isArray(foodHistory) ? foodHistory : (foodHistory ? [foodHistory] : []);
  // call run with arrays (do not pre-join)
  const response = await run(
    `Tell me what to eat in ${location.city}, ${location.country}`,
    foodHistory,
    foodDeclined
  );

  let food = response.Food;
    // only get 3 words from the output to make sure it only gets food
    if (food.trim().split(/\s+/).length > 3) {
      food = food.trim().split(/\s+/).slice(0, 3).join(' ');
    }
    sessionData.lastRecommended = food;

    const imageLink = await getFoodImage(food);
    const output = {
      food: food,
      imageLink: imageLink,
      anonId: req.anonId
    }
    res.status(200).send(output)
  } catch (error) {
    console.error(error.message)
    res.status(404).json({ message: error.message });
  }
    
})


app.post('/restaurants', verifyToken, async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY_PLACES;
    const latitude = req.body.location.latitude;
    const longitude = req.body.location.longitude;
    const food = req.body.food;
    const body = {
      textQuery: `${food} restaurants`,
      maxResultCount: 6,
      locationBias: {
        circle: {
          center: { latitude, longitude },
          radius: 2 * 1000.0 // 2 km radius
        }
      },
      openNow: true,
      rankPreference: "RELEVANCE"
    };
    const response = await fetch(
    `https://places.googleapis.com/v1/places:searchText`,
    {
      headers: { 
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.photos,places.priceRange,places.rating'
      },
      method: "POST",
      body: JSON.stringify(body),
      
    }
  );
    const result = await response.json();

  for (let i = 0; i < result.places.length; i++) {
    try {
      const place = result.places[i];

      // Ensure photos is present and has at least one photo entry
      if (!place.photos || !Array.isArray(place.photos) || place.photos.length === 0) {
        place.photoLink = process.env.IMAGE_FALLBACK_URL || null;
        continue;
      }

      const photoName = place.photos[0]?.name;
      if (!photoName) {
        place.photoLink = process.env.IMAGE_FALLBACK_URL || null;
        continue;
      }

      const photoResp = await fetch(
        `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400&skipHttpRedirect=true`,
        { method: "GET" }
      );

      if (!photoResp.ok) {
        console.warn(`Places photo fetch failed for ${photoName} HTTP ${photoResp.status}`);
        place.photoLink = process.env.IMAGE_FALLBACK_URL || null;
        continue;
      }

      const photoData = await photoResp.json();
      // photoData.photoUri may be present — validate it
      place.photoLink = photoData?.photoUri || process.env.IMAGE_FALLBACK_URL || null;

      // remove original photos array to reduce payload
      delete place.photos;
    } catch (e) {
      console.error(`Error fetching photo for place index ${i}:`, e && e.message ? e.message : e);
      result.places[i].photoLink = process.env.IMAGE_FALLBACK_URL || null;
      delete result.places[i].photos;
    }
  }

    
    res.send(result);
  } catch (error) {
    console.error(error.message);
    res.status(404).json({ message: error.message });
  }
    
})

app.post('/register', async (req, res) => {
  try {
    let { username, email, password } = req.body;
    email = email.toLowerCase();

    validateSignup(username, email, password);

    // Check if the email already exists
    const userRef = db.collection('whattoeat_users').doc(email)
    const snapshot = await userRef.get();
    if (snapshot.exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    await userRef.set({
      username,
      email,
      password: hashedPassword
    });
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message});
  }
    
})

app.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();

    validateLogin(email, password);
    
    const userRef = db.collection('whattoeat_users').doc(email);
    const doc = await userRef.get();
    

    if (!doc.exists) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = doc.data();
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token, user: { username: user.username, email } });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message});
  }
});

// Protected route to get user details
app.get('/user', verifyToken, async (req, res) => {
  try {
    const email = req.user.email; //from verify token
    // Check if the email already exists
    const userRef = db.collection('whattoeat_users').doc(email);
    const doc = await userRef.get();
    if (doc.exists) {
      const user = doc.data();
      res.status(200).json({ message: 'User Found', user: { username: user.username, email: user.email } });
    }
    res.status(400).json({ message: 'user not found' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});


app.post('/save-food', verifyToken, async (req, res) => {
  try {
    
    let food = req.body.food;
    food = food.toLowerCase()
    const email = req.user.email; //from verify token
    await saveFood(email, food);

    res.status(200).json({message: 'Success'});
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/saved-food', verifyToken, async (req, res) => {
  try {
    

    const email = req.user.email;
    let foodHistory = await getFoodHistory(email);

    
    

    let historyObject = { food: [] };

    if (foodHistory[0] !== 'None') {
      
      

      for (let i = 0; i < foodHistory.length; i++) {
        let image;
        try {
          image = await getFoodImage(foodHistory[i]);
        } catch (e) {
          console.error(`Error getting image for ${foodHistory[i]}:`, e.message);
          image = 'null';
        }

        historyObject.food.push({
          imageLink: image,
          foodName: foodHistory[i]
        });
      }
    }

    res.status(200).json(historyObject);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/delete-food', verifyToken, async (req, res) => {
  try {
    
    
    const foodName = req.body.foodName;
    const email = req.user.email;
    const userRef = db.collection('whattoeat_users').doc(email);
    const removeRes = await userRef.update({
      food: FieldValue.arrayRemove(foodName)
    })

    res.status(200).json({message: 'Success'});
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  
})
