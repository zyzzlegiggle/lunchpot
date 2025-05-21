const { FieldValue } = require('@google-cloud/firestore');
const firestore = require('@google-cloud/firestore');
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

async function getFoodHistory(email) {
  const userRef = db.collection('whattoeat_users').doc(email);
  const snapshot = await userRef.get();
  const foodHistory = snapshot.data().food;
  return  foodHistory || ["None"];

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

function validateEmail(email) {
  if(email.toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)){
      return;
    }

  throw new Error('Invalid Email');
}

function validatePassword(password) {
    const minLength = 8;
    const hasUppercase = /[A-Z]/;
    const hasNumber = /[0-9]/;

    if (
      password.length >= minLength &&
      hasUppercase.test(password) &&
      hasNumber.test(password)
    ) {
      return;
    }

    throw new Error(`Invalid password`)
  }

  function validateUsername(username) {
    const minLength = 8;
    if (username.length >= minLength) return true;
    throw new Error(`Invalid username`);
  }

function validateLogin(email, password){
  try {
      validateEmail(email);
      validatePassword(password);  
    } catch(e) {
      throw new Error(e.message);
    }
}

function validateSignup(username, email, password) {
  try {
      validateEmail(email);
      validatePassword(password);
      validateUsername(username);
      
    } catch (e) {
      throw new Error(e.message);
    }
}

const db = new firestore({
  projectId: process.env.GOOGLE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_JSON_KEY_PATH,
});


async function saveFood(email, food){
  try {
    const userRef = db.collection('whattoeat_users').doc(email);
    const unionRes = await userRef.update({
      food: FieldValue.arrayUnion(food)
    })
    console.log(unionRes);
  } catch (e) {
    throw new Error(e.message)
  }
}

module.exports = {
  run,
  insertVector, 
  getFoodHistory, 
  getFoodImage, 
  validateLogin, 
  validateSignup,
  saveFood
}