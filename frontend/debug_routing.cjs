const axios = require('axios');

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc4ODdmY2YyZTA0MjQxNjY4ZmU2NGFiNDc2MTQ1ZGY5IiwiaCI6Im11cm11cjY0In0=";

async function testRoute(name, startLat, startLon, endLat, endLon) {
    console.log(`\nTesting ${name}:`);
    console.log(`Start: ${startLat}, ${startLon}`);
    console.log(`End:   ${endLat}, ${endLon}`);

    // Function mimics getDirections in api.js:
    // start: `${startLon},${startLat}`
    // end:   `${endLon},${endLat}`

    const startParam = `${startLon},${startLat}`;
    const endParam = `${endLon},${endLat}`;
    console.log(`API Params -> start=${startParam} end=${endParam}`);

    try {
        const response = await axios.get(`https://api.openrouteservice.org/v2/directions/driving-car`, {
            params: {
                api_key: ORS_API_KEY,
                start: startParam,
                end: endParam
            }
        });
        console.log("✅ Success! Route found.");
        console.log("Distance:", response.data.features[0].properties.summary.distance, "m");
    } catch (error) {
        console.log("❌ Failed!");
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Error Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.log("Error:", error.message);
        }
    }
}

async function runTests() {
    // 1. Test Short Route (Heidelberg internal - Known good)
    await testRoute("Short Route (Heidelberg)", 49.41461, 8.681495, 49.420318, 8.687872);

    // 2. Test Long Route (India to Germany - Suspected User Case)
    // Start: Kerala approx (10.9, 76.4)
    // End: Heidelberg (49.4, 8.6)
    await testRoute("Long Route (India -> Germany)", 10.9032, 76.4347, 49.4203, 8.6878);

    // 3. Test "Swapped" Long Route (Just in case user location was swapped)
    // Lat/Lon swapped: Start(76.4, 10.9) -> Arctic/Ocean?
    await testRoute("Swapped Coordinates Check", 76.4347, 10.9032, 8.6878, 49.4203);
}

runTests();
