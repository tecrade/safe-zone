const axios = require('axios');

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc4ODdmY2YyZTA0MjQxNjY4ZmU2NGFiNDc2MTQ1ZGY5IiwiaCI6Im11cm11cjY0In0=";

// Coordinates from the user's error log
// Start: Kerala, India
const startLon = 76.43478182410998;
const startLat = 10.903237157227265;
// End: Heidelberg, Germany
const endLon = 8.687872;
const endLat = 49.420318;

const getDirections = async () => {
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
        }
    }
};

getDirections();
