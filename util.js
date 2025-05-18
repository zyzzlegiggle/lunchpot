let dotenv = require('dotenv').config()
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

async function getFoodImage(food){
  try {
    const apiKey = process.env.GOOGLE_API_KEY_CUSTOMSEARCH;
    const engineID = process.env.GOOGLE_ENGINE_ID
    const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineID}&q=${food}&searchType=image`,
    {
      method: "GET"
    }
  );
    const result = await response.json();
    return result.items[Math.floor(Math.random() * result.items.length - 1)].link;
  } catch (e) {
    throw new Error(e.message);
  }
}

module.exports = {run, insertVector, getFoodHistory, getFoodImage}