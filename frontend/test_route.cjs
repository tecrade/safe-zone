const axios = require('axios');

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc4ODdmY2YyZTA0MjQxNjY4ZmU2NGFiNDc2MTQ1ZGY5IiwiaCI6Im11cm11cjY0In0=";

const getDirections = async (startLat, startLon, endLat, endLon) => {
    try {
        console.log(`Requesting route from ${startLon},${startLat} to ${endLon},${endLat}`);
        const response = await axios.get(`https://api.openrouteservice.org/v2/directions/driving-car`, {
            params: {
                api_key: ORS_API_KEY,
                start: `${startLon},${startLat}`,
                end: `${endLon},${endLat}`
            }
        });
        console.log("Success:", JSON.stringify(response.data.features[0].geometry.coordinates.slice(0, 2)));
    } catch (error) {
        console.error("Error fetching directions:", error.message);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", JSON.stringify(error.response.data, null, 2));
            console.error("Response headers:", JSON.stringify(error.response.headers, null, 2));
        }
    }
};

// Test coordinates from dashboard default
// start: 49.41461, 8.681495
// end: 49.420318, 8.687872
getDirections(49.41461, 8.681495, 49.420318, 8.687872);
