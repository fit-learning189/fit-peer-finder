// src/config.js

// 1. Detect if we are running on a live server (Vercel) or local machine
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// 2. Set the API URL accordingly
// REPLACE the string below with your actual Render Backend URL once you have it
export const API_URL = isProduction 
  ? 'https://alx-peerfinder.onrender.com' 

  : 'http://127.0.0.1:5000';
