const fs = require('fs');

console.log("--- Starting Smart Attendance Test Suite ---");

// 1. Check for AI Models
if (fs.existsSync('./models')) {
    console.log("✅ Test 1 Passed: Models folder exists.");
} else {
    console.error("❌ Test 1 Failed: Models folder missing.");
    process.exit(1);
}

// 2. Check for Labeled Images (Your User Database)
if (fs.existsSync('./labeled_images')) {
    console.log("✅ Test 2 Passed: Labeled images folder found.");
} else {
    console.error("❌ Test 2 Failed: Labeled images folder missing.");
    process.exit(1);
}

// 3. Check for the main Application file
if (fs.existsSync('./app.js')) {
    console.log("✅ Test 3 Passed: app.js is present.");
} else {
    console.error("❌ Test 3 Failed: app.js is missing.");
    process.exit(1);
}

console.log("--- All Automated Tests Successful! ---");
process.exit(0);
