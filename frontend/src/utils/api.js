import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const signup = (data) => api.post('/signup', data);
export const login = (data) => api.post('/login', data);

// Location
export const updateLocation = (lat, lon) => api.post('/location/update', { latitude: lat, longitude: lon });
export const getNearbyUsers = (lat, lon, radius = 5000) => api.get(`/location/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);

// Volunteer
export const registerVolunteer = (volunteerType) => api.post('/volunteer/register', { volunteer_type: volunteerType });
export const updateAvailability = (isAvailable) => api.put('/volunteer/availability', { is_available: isAvailable });

// Emergency
export const createEmergencyRequest = () => api.post('/emergency/request');
export const cancelEmergencyRequest = () => api.post('/emergency/cancel');
export const acceptEmergencyRequest = (requestId) => api.post('/emergency/accept', { request_id: requestId });
export const getActiveEmergencies = () => api.get('/emergency/active');
export const getEmergencyStatus = (requestId) => api.get(`/emergency/status/${requestId}`);

// Crime data
export const getCrimeDensity = (lat, lon, radius = 2000) => api.get(`/crime/density?lat=${lat}&lon=${lon}&radius=${radius}`);
export const getCrimeIntensity = (lat, lon) => api.get(`/crime/intensity?lat=${lat}&lon=${lon}`);

// OpenRouteService API
const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc4ODdmY2YyZTA0MjQxNjY4ZmU2NGFiNDc2MTQ1ZGY5IiwiaCI6Im11cm11cjY0In0="; // Using key from prompt

// Geoapify API
const GEOAPIFY_API_KEY = "193c5481109241bcba050277fcae7416";

export const getCoordinates = async (text) => {
    try {
        const response = await axios.get(`https://api.geoapify.com/v1/geocode/search`, {
            params: {
                text: text,
                apiKey: GEOAPIFY_API_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching coordinates:", error);
        throw error;
    }
};

export const getDirections = async (startLat, startLon, endLat, endLon) => {
    try {
        const response = await axios.get(`https://api.openrouteservice.org/v2/directions/driving-car`, {
            params: {
                api_key: ORS_API_KEY,
                start: `${startLon},${startLat}`, // ORS takes lon,lat
                end: `${endLon},${endLat}`
            }
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching directions:", error);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Request params:", error.config.params);
        }
        throw error;
    }
};

export default api;
