let dotenv = require('dotenv').config()

const express = require('express');
const { default: helmet } = require('helmet');
const app = express()
const port = 3000
const cors = require('cors');
const { getFoodImage, getFoodHistory, run, insertVector, validateLogin, validateSignup, saveFood } = require('./util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const firestore = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');

const cookieParser = require('cookie-parser');

const isProd = process.env.NODE_ENV === 'production';

// config
app.use(express.json());
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:8100',
  credentials: true
}));
app.use(cookieParser());

// background cleanup (this run every 1 minute)
setInterval(async () => {
  console.log("background session run");
  console.log(eatSession);
  const now = Date.now();
  for (const [email, session] of eatSession.entries()) {
    if (now - session.lastFetch > 10 * 60 * 1000) {
      // Check if the email already exists
      const userRef = db.collection('whattoeat_users').doc(email)
      const snapshot = await userRef.get();
      if (snapshot.exists) {
        saveFood(email, eatSession.get(email).lastRecommended)
      }
      eatSession.delete(email); // remove if there is no activity after 10 minutes
      console.log(`Session for ${email} has been removed due to inactivity.`);
    }
  }
}, 60 * 1000)

const eatSession = new Map(); // key: username, value: { foodDeclined: [], lastRecommended: "", lastFetch: Date }

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
    console.log(token);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.user = decoded; // decoded = { email: 'something@example.com', iat: ..., exp: ... }
      next();
    });
  } catch (e) {
    throw new Error(e.message);
  }
};


// assign before get email
const assignAnonymousId = (req, res, next) => {
  let anonId = req.cookies?.anonId;

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
      const session = eatSession.get(sessionKey);
      session.foodDeclined.push(session.lastRecommended);
      session.lastFetch = now;
    }
    
    let foodHistory = await getFoodHistory(sessionKey)
    console.log(foodHistory)
    let sessionData = eatSession.get(sessionKey);
    let foodDeclined = sessionData.foodDeclined;
    foodHistory = (foodHistory.length >= 2) ? foodHistory.join(", "): foodHistory;
    foodDeclined = (foodDeclined.length >=2) ? foodDeclined.join(", "): foodDeclined;
    const model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    const systemPrompt = `
    -Recommend 1 food in a country to be recommended to user
    -You can also recommend food from the user food history
    -User food history: ${foodHistory}
    -Food that user declined: ${foodDeclined}
    -Do not recommend foods that user declined

    `
    const mess = {
    "messages": [
        {
        "role": "system",
        "content": systemPrompt
        },
        {
        "role": "user",
        "content": `Tell me what to eat in ${location.city},${location.country}`
        }
    ],
    "response_format": {
    "type": "json_schema",
    "json_schema": {
      "type": "object",
      "properties": {
        "Location": "string",
        "Food": "string"
      },
      "required": [
        "Location",
        "Food"
      ]
    }
    }
    };

    
    const response = await run(model, mess);
    const food = response.result.response.Food;
    // only get 3 words from the output to make sure it only gets food
    if (food.trim().split(/\s+/).length > 3) {
      food = food.trim().split(/\s+/).slice(0, 3).join(' ');
    }
    sessionData.lastRecommended = food;

    const imageLink = await getFoodImage(food);
    const output = {
      food: food,
      imageLink: imageLink
    }
    res.status(200).send(output)
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
    
})


app.post('/restaurants', async (req, res) => {
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
      const photo = await fetch(
        `https://places.googleapis.com/v1/${result.places[i].photos[0].name}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400&skipHttpRedirect=true`,
        {
          method: "GET",
        }
      );
      const photoData = await photo.json();
      result.places[i].photoLink = photoData.photoUri;
      // delete photos array containing photo data (not link)
      delete result.places[i].photos; // replace 'unwantedKey' with the actual property name
    }
    console.log(result.places);
    res.send(result);
  } catch (error) {
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
    console.log(doc);

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
    res.status(500).json({ error: error.message });
  }
});

app.post('/save-food', verifyToken, async (req, res) => {
  try {
    console.log('save-food')
    let food = req.body.food;
    food = food.toLowerCase()
    const email = req.user.email; //from verify token
    await saveFood(email, food)
    res.status(200).json({message: 'Success'});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/createindex', async (req, res) => {
    try {
      const indexName = req.body.indexName
      const body = {
        "name": indexName,
        "description": "some index description (use bge-small-en-v1.5)",
        "config": {
            "dimensions": 384,
            "metric": "euclidean"
        },
      }
      const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.CLOUDFLARE_API_KEY_VECTORIZE}`
            },
            method: "POST",
            body: JSON.stringify(body),
          }
        );

      const result = await response.json();
      res.send(result);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
})

app.get('/getindex', async (req, res) => {

    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.CLOUDFLARE_API_KEY_VECTORIZE}`
          },
          method: "GET",
        }
      );

    const result = await response.json();
    res.send(result);
})

app.delete('/deleteindex', async (req, res) => {
    try {
      const indexName = req.body.indexName;
      const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes/${indexName}`,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.CLOUDFLARE_API_KEY_VECTORIZE}`
            },
            method: "DELETE",
          }
        );

      const result = await response.json();
      res.send(result);
    } catch (e) {
      res.status(404).json({ message: error.message});
    }
})

app.post('/embed', async (req, res) => {
    try {
      model = "@cf/baai/bge-small-en-v1.5";
      const stories = [
        "This is a story about an orange cloud",
        "This is a story about a llama",
        "This is a story about a hugging emoji",
      ];
      const body = {
        "text": stories
      }
      let embeddings = await run(model, body);
      embeddings = embeddings.result;
      
      // data vectors
      let vectors = [];
      const namespaces = [
        "orange",
        "llama",
        "hugging emoji"
      ]
      let id = 1;
      embeddings.data.forEach((vector) => {
        vectors.push({
          id: `${id}`,
          values: vector,
          namespace: namespaces[id-1]
        })
        id++;
      })
      
      //store the vectors
      res.send(await insertVector("demo-index", vectors));
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
})

app.get('/queryindex', async (req, res) => {
    try {
      model = "@cf/baai/bge-small-en-v1.5";
      const stories = [
        "This is a story about an orange cloud",
        "This is a story about a llama",
        "This is a story about a hugging emoji",
      ];
      const body = {
        "text": stories
      }
      let embeddings = await run(model, body);
      embeddings = embeddings.result;
      
      // data vectors
      let vectors = [];
      const namespaces = [
        "orange",
        "llama",
        "hugging emoji"
      ]
      let id = 1;
      embeddings.data.forEach((vector) => {
        vectors.push({
          id: `${id}`,
          values: vector,
          namespace: namespaces[id-1]
        })
        id++;
      })
      
      //store the vectors
      res.send(await insertVector("demo-index", vectors));
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
