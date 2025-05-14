let dotenv = require('dotenv').config()

const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')

// config
app.use(express.json());
let corsOptions = {
   origin : ['http://localhost:4200/'],
}
app.use(cors());

// background cleanup (this run every 1 minute)
setInterval(() => {
  console.log("background session run");
  console.log(eatSession);
  const now = Date.now();
  for (const [username, session] of eatSession.entries()) {
    if (now - session.lastFetch > 10 * 60 * 1000) {
      eatSession.delete(username); // remove if there is no activity after 10 minutes
      console.log(`Session for ${username} has been removed due to inactivity.`);
    }
  }
}, 60 * 1000)

const eatSession = new Map(); // key: username, value: { foodDeclined: [], lastRecommended: "", lastFetch: Date }

async function run(model, input) {
  try {
    const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`,
    {
      
      headers: { 
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY_WORKERS}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify(input),
    }
  );
    const result = await response.json();
    return result;
  } catch (e) {
    res.status(404).json({ message: error.message });
  }
  
}

async function insertVector(indexName, vectors) {
  try {
    // make ndjson format
    const input = vectors.map(v => JSON.stringify(v)).join('\n');
    const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes/${indexName}/insert`,
    {
      headers: { 
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY_VECTORIZE}` ,
        "Content-Type": "application/x-ndjson"
      },
      method: "POST",
      body: input
    }
  );
    const result = await response.json();
    return result;
  } catch (e) {
    res.status(404).json({ message: error.message });
  }
}

function getFoodHistory(username) {
  const foodData = {
    "jack": ["ayam goreng"],
    "lucy": ["es teler, mie ayam"],
    "jamal": ["pempek, siomay"]
  }

  username = username.toLowerCase();
  return foodData[username] || ["None"];

}

async function getRestaurant(food, location) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY_PLACES;
    const country = location.country;
    const city = location.city;
    const latitude = location.latitude;
    const longitude = location.longitude;
    console.log(location);
    const body = {
      textQuery: `${food} restaurants`,
      maxResultCount: 5,
      locationBias: {
        circle: {
          center: { latitude, longitude },
          radius: 1 * 1000.0 // 1 km radius
        }
      }
    };
    console.log(body);
    const response = await fetch(
    `https://places.googleapis.com/v1/places:searchText`,
    {
      headers: { 
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress'
      },
      method: "POST",
      body: JSON.stringify(body),
      
    }
  );
    const result = await response.json();
    console.log(result);
    return result;
  } catch (e) {
    res.status(404).json({ message: error.message });
  }
}



  
  
  

app.post('/', async (req, res) => {
  try {
    const location = req.body.location;
    const username = req.body.username;
    // get time
    const now = Date.now();

    // create session
    if (!eatSession.has(username)) {
      eatSession.set(username, {
        foodDeclined: [],
        lastRecommended: "",
        lastFetch: now
      })
    } else {
      const session = eatSession.get(username);
      session.foodDeclined.push(session.lastRecommended);
      session.lastFetch = now
    }
    
    let foodHistory = getFoodHistory(username)
    let sessionData = eatSession.get(username);
    let foodDeclined = sessionData.foodDeclined;
    console.log(foodHistory);
    foodHistory = (foodHistory.length >= 2) ? foodHistory.join(", "): foodHistory;
    foodDeclined = (foodDeclined.length >=2) ? foodDeclined.join(", "): foodDeclined;
    const model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    const systemPrompt = `
    -Recommend 1 food in a country to be recommended to user
    -You can also recommend food from the user food history
    -You can recommend a popular brand that is in that country (e.g. KFC)
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
    const foodLocation = response.result.response.Location;
    sessionData.lastRecommended = food;
    const output = {
      "Food": food
    }
    res.send(await getRestaurant(food, location));
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
    
})



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
