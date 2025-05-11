let dotenv = require('dotenv').config()

const express = require('express')
const app = express()
const port = 3000

// config
app.use(express.json());




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
    "jack": ["Banana, Waffles"],
    "lucy": ["Ice Cream, Pistachio"],
    "jamal": ["Fried Chicken, KFC"]
  }

  username = username.toLowerCase();
  return foodData[username] || "None";

}


  
  
  

app.post('/', async (req, res) => {
  try {
    const location = req.body.location;
    const username = req.body.username;
    
    const foodHistory = getFoodHistory(username).join(", ");
    const model = "@cf/meta/llama-3.1-8b-instruct-fast";
    const systemPrompt = `
    -Extract data about foods in a country (5 foods only) to be recommended to user
    -use user food history to get what user preferences for what kinds of food
    -User food history: ${foodHistory}
    `
    const mess = {
    "messages": [
        {
        "role": "system",
        "content": systemPrompt
        },
        {
        "role": "user",
        "content": `Tell me what to eat in ${location}`
        }
    ],
    
    };

    
    await run(model, mess).then((response) => {
        res.send(response);
    });
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
