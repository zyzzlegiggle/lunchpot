const { FieldValue } = require('@google-cloud/firestore');
const firestore = require('@google-cloud/firestore');
let dotenv = require('dotenv').config()
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { JsonOutputParser } = require("@langchain/core/output_parsers");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

async function run(query, foodHistory = [], foodDeclined = []) {
  try {
    // Define schema as instructions
    const formatInstructions = `
Respond only in valid JSON. The JSON object you return should match the following schema:
{
  "Location": "string",
  "Food": "string"
}
`;

    // Parser
    const parser = new JsonOutputParser();

    // Prompt template
    const prompt = await ChatPromptTemplate.fromMessages([
      [
        "system",
        "Recommend 1 food in a country to the user. Consider their food history and declined foods. Do not suggest declined foods.\n{format_instructions}",
      ],
      [
        "human",
        "User food history: {foodHistory}\nDeclined foods: {foodDeclined}\nQuery: {query}",
      ],
    ]).partial({
      format_instructions: formatInstructions,
    });

    // Gemini model
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash", 
      temperature: 0.8
    });

    // Chain prompt → model → parser
    const chain = prompt.pipe(model).pipe(parser);

    // Execute
    const response = await chain.invoke({
      query,
      foodHistory: foodHistory.length ? foodHistory.join(", ") : "None",
      foodDeclined: foodDeclined.length ? foodDeclined.join(", ") : "None",
    });

    return response; // will be { Location: "...", Food: "..." }
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getFoodHistory(email) {
  const userRef = db.collection('whattoeat_users').doc(email);
  const snapshot = await userRef.get();
  if (!snapshot.exists) return [];
  const foodHistory = snapshot.data().food;
  return Array.isArray(foodHistory) ? foodHistory : [];
    

}

async function getFoodImage(food) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY_CUSTOMSEARCH;
    const engineID = process.env.GOOGLE_ENGINE_ID;
    if (!apiKey || !engineID) {
      console.warn("Custom Search credentials missing. Returning fallback image.");
      return process.env.IMAGE_FALLBACK_URL || null;
    }

    const q = encodeURIComponent(food);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineID}&q=${q}&searchType=image&num=10`;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      console.warn(`CustomSearch returned HTTP ${response.status}`);
      return process.env.IMAGE_FALLBACK_URL || null;
    }

    const result = await response.json();

    // Validate items array
    if (!result || !Array.isArray(result.items) || result.items.length === 0) {
      console.warn(`No images returned for query "${food}"`);
      return process.env.IMAGE_FALLBACK_URL || null;
    }

    // pick a valid random item
    const idx = Math.floor(Math.random() * result.items.length); // 0 .. length-1
    const chosen = result.items[idx];

    // defensive checks for link property
    if (chosen && (chosen.link || chosen.image?.thumbnailLink || chosen.displayLink)) {
      return chosen.link || chosen.image?.thumbnailLink || chosen.displayLink;
    }

    // fallback scanning for first available link-like field
    for (const it of result.items) {
      if (it && (it.link || it.image?.thumbnailLink || it.displayLink)) {
        return it.link || it.image?.thumbnailLink || it.displayLink;
      }
    }

    // final fallback
    return process.env.IMAGE_FALLBACK_URL || null;
  } catch (e) {
    console.error("getFoodImage error:", e && e.message ? e.message : e);
    return process.env.IMAGE_FALLBACK_URL || null;
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
    
  } catch (e) {
    throw new Error(e.message)
  }
}

module.exports = {
  run,
  getFoodHistory, 
  getFoodImage, 
  validateLogin, 
  validateSignup,
  saveFood
}