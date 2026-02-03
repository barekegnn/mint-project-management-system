// Test login API
// Run with: node scripts/test-login-api.js

const DEPLOYMENT_URL = "https://mint-pms.vercel.app";

async function testLogin() {
  console.log("🧪 Testing login API...");
  console.log("📍 URL:", `${DEPLOYMENT_URL}/api/login`);

  try {
    const response = await fetch(`${DEPLOYMENT_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@demo.com",
        password: "Admin@123",
      }),
    });

    console.log("\n📊 Response Status:", response.status);
    console.log("📊 Response Headers:");
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const data = await response.json();
    console.log("\n📦 Response Body:");
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n✅ Login API is working!");
      console.log("👤 User:", data.user);
    } else {
      console.log("\n❌ Login failed!");
      console.log("Error:", data);
    }
  } catch (error) {
    console.error("\n❌ Error testing login:", error);
  }
}

testLogin();
