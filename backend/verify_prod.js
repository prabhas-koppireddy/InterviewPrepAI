const axios = require("axios");

const BASE_URL = "https://interviewprepai-fthm.onrender.com";
const testEmail = `prod_test_${Date.now()}@example.com`;
const testPassword = "Password123!";

const runProdTests = async () => {
  try {
    console.log("--- STARTING PRODUCTION BACKEND TESTS ---");
    console.log("Backend URL:", BASE_URL);

    // 1. Upload a dummy profile picture file
    console.log("\n1. Testing Image Upload to Base64...");
    const FormData = require("form-data");
    const form = new FormData();
    const dummyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    form.append("image", dummyPng, "test_avatar.png");

    const uploadRes = await axios.post(`${BASE_URL}/api/auth/upload-image`, form, {
      headers: form.getHeaders(),
    });

    const profileImageUrl = uploadRes.data.imageUrl;
    console.log("Success! Image uploaded. URL starts with:", profileImageUrl.substring(0, 50) + "...");

    // 2. Register user
    console.log("\n2. Testing User Registration...");
    const regRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: "Prod Test User",
      email: testEmail,
      password: testPassword,
      profileImageUrl: profileImageUrl,
    });

    const token = regRes.data.token;
    const userId = regRes.data._id;
    console.log(`Success! Registered User ID: ${userId}`);

    // 3. Login user
    console.log("\n3. Testing User Login...");
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword,
    });

    console.log("Success! Logged in token received.");

    console.log("\n--- ALL PRODUCTION ENDPOINT TESTS PASSED! ---");
  } catch (error) {
    console.error("\nProduction Test Failed!");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", JSON.stringify(error.response.data));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
};

runProdTests();
