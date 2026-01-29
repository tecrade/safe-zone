import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polyline } from 'react-leaflet';
import { AlertTriangle, LogOut, UserPlus, Shield, MapPin, Bell, Navigation, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { getCurrentPosition, formatDistance, calculateDistance } from '../utils/location';
import { updateLocation, getCrimeDensity, createEmergencyRequest, getActiveEmergencies, getDirections, getCoordinates } from '../utils/api';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map
function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, 16); // Increased zoom for navigation
        }
    }, [position, map]);
    return null;
}

function Dashboard({ user, onLogout }) {
    const [userLocation, setUserLocation] = useState(null);
    const [crimeData, setCrimeData] = useState(null);
    const [emergencyActive, setEmergencyActive] = useState(false);
    const [activeRequests, setActiveRequests] = useState([]);
    const [riskLevel, setRiskLevel] = useState('safe');

    // Navigation states
    const [destinationInput, setDestinationInput] = useState(''); // Default suggestion
    const [routePath, setRoutePath] = useState(null);
    const [routeInstructions, setRouteInstructions] = useState([]);
    const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const [currentInstructionText, setCurrentInstructionText] = useState("Start navigation");
    const [nextInstructionText, setNextInstructionText] = useState("");

    const navigate = useNavigate();

    // Get initial location
    useEffect(() => {
        const getLocation = async () => {
            try {
                const position = await getCurrentPosition();
                setUserLocation([position.latitude, position.longitude]);

                await updateLocation(position.latitude, position.longitude);

                const crimeResponse = await getCrimeDensity(position.latitude, position.longitude);
                setCrimeData(crimeResponse.data.crime_zones);
                setRiskLevel(crimeResponse.data.current_risk_level);
            } catch (error) {
                console.error('Error getting location:', error);
                setUserLocation([49.41461, 8.681495]); // Heidelberg fallback
            }
        };

        getLocation();
    }, []);

    // Regular location updates
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!isNavigating && userLocation) {
                try {
                    const position = await getCurrentPosition();
                    setUserLocation([position.latitude, position.longitude]);
                    await updateLocation(position.latitude, position.longitude);

                    const crimeResponse = await getCrimeDensity(position.latitude, position.longitude);
                    setCrimeData(crimeResponse.data.crime_zones);
                    setRiskLevel(crimeResponse.data.current_risk_level);
                } catch (error) {
                    console.error('Error updating location:', error);
                }
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isNavigating, userLocation]);

    // Update instruction based on progress
    useEffect(() => {
        if (isNavigating && routePath && routeInstructions.length > 0) {
            // Find which step we are currently in
            const currentStep = routeInstructions.find(step => {
                const startIdx = step.way_points[0];
                const endIdx = step.way_points[1];
                return currentRouteIndex >= startIdx && currentRouteIndex <= endIdx;
            });

            if (currentStep) {
                setCurrentInstructionText(currentStep.instruction);

                // Find next step
                const currentStepIdx = routeInstructions.indexOf(currentStep);
                if (currentStepIdx < routeInstructions.length - 1) {
                    setNextInstructionText(routeInstructions[currentStepIdx + 1].instruction);
                } else {
                    setNextInstructionText("Arrive at destination");
                }
            }
        }
    }, [currentRouteIndex, isNavigating, routePath, routeInstructions]);


    // Keyboard navigation handler
    useEffect(() => {
        const handleKeyDown = async (e) => {
            if (!isNavigating || !routePath || !userLocation) return;

            let newIndex = currentRouteIndex;

            if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                newIndex = Math.min(currentRouteIndex + 1, routePath.length - 1);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                newIndex = Math.max(currentRouteIndex - 1, 0);
            } else {
                return;
            }

            if (newIndex !== currentRouteIndex) {
                setCurrentRouteIndex(newIndex);
                const newPos = [routePath[newIndex][1], routePath[newIndex][0]]; // Path is [lon, lat]
                setUserLocation(newPos);

                await updateLocation(newPos[0], newPos[1]);

                getCrimeDensity(newPos[0], newPos[1]).then(res => {
                    setCrimeData(res.data.crime_zones);
                    setRiskLevel(res.data.current_risk_level);
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isNavigating, routePath, currentRouteIndex, userLocation]);

    // Check for active emergencies
    useEffect(() => {
        const checkEmergencies = async () => {
            try {
                const response = await getActiveEmergencies();
                setActiveRequests(response.data.requests || []);
                setEmergencyActive(response.data.requests?.length > 0);
            } catch (error) {
                console.error('Error checking emergencies:', error);
            }
        };

        checkEmergencies();
        const interval = setInterval(checkEmergencies, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleEmergencyRequest = async () => {
        if (emergencyActive) {
            alert('You already have an active emergency request');
            return;
        }

        try {
            const response = await createEmergencyRequest();
            setEmergencyActive(true);
            alert(`Emergency request sent! ${response.data.nearest_volunteers?.length || 0} volunteers nearby have been notified.`);
        } catch (error) {
            console.error('Error creating emergency request:', error);
            alert(error.response?.data?.detail || 'Failed to create emergency request');
        }
    };

    const handleRouteSearch = async (e) => {
        e.preventDefault();
        if (!userLocation || !destinationInput) return;

        try {
            // 1. Geocode the address
            let destLat, destLon;

            // Check if input is coordinates (e.g. "8.68, 49.4")
            if (/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(destinationInput)) {
                const [lon, lat] = destinationInput.split(',').map(c => parseFloat(c.trim()));
                destLon = lon;
                destLat = lat;
            } else {
                // Use Geoapify
                const geoData = await getCoordinates(destinationInput);
                if (geoData.features && geoData.features.length > 0) {
                    const coords = geoData.features[0].geometry.coordinates;
                    destLon = coords[0];
                    destLat = coords[1];
                } else {
                    alert('Location not found. Please try a different address.');
                    return;
                }
            }

            // 2. Get directions
            const data = await getDirections(userLocation[0], userLocation[1], destLat, destLon);

            const feature = data.features[0];
            const coordinates = feature.geometry.coordinates;
            const properties = feature.properties;

            setRoutePath(coordinates);
            setRouteInstructions(properties.segments[0].steps);
            setIsNavigating(true);
            setCurrentRouteIndex(0);

        } catch (error) {
            console.error("Routing error:", error);
            alert("Failed to calculate route. Please check the address or try again.");
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#10b981';
        }
    };

    const getRiskText = (level) => {
        switch (level) {
            case 'high': return 'High Risk Area';
            case 'medium': return 'Medium Risk Area';
            case 'low': return 'Low Risk Area';
            default: return 'Safe Area';
        }
    };

    return (
        <div className="min-h-screen gradient-bg relative flex flex-col">
            {/* Header */}
            <div className="glass-card m-4 p-4 z-10">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-electric-blue" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">SafeZone</h1>
                            <p className="text-sm text-gray-400">Welcome, {user?.name}</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl mx-4">
                        <form onSubmit={handleRouteSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 " />
                                <input
                                    type="text"
                                    value={destinationInput}
                                    onChange={(e) => setDestinationInput(e.target.value)}
                                    placeholder="Enter address or place name..."
                                    className="input-field pl-10"
                                />
                            </div>
                            <button type="submit" className="btn-primary flex items-center gap-2">
                                <Navigation className="w-4 h-4" />
                                Go
                            </button>
                        </form>
                    </div>

                    <div className="flex gap-3">
                        {!user?.is_volunteer && (
                            <button
                                onClick={() => navigate('/volunteer-register')}
                                className="btn-success flex items-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" />
                                Volunteer
                            </button>
                        )}
                        <button
                            onClick={onLogout}
                            className="bg-navy-medium hover:bg-midnight px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col mx-4 mb-4 gap-4">

                {/* Full Width Map */}
                <div className="glass-card p-2 w-full h-[60vh] relative rounded-xl overflow-hidden shadow-2xl border border-white/10">
                    {userLocation ? (
                        <MapContainer
                            center={userLocation}
                            zoom={13}
                            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <RecenterMap position={userLocation} />

                            {routePath && (
                                <Polyline
                                    positions={routePath.map(coord => [coord[1], coord[0]])}
                                    color="#00d4ff"
                                    weight={6}
                                    opacity={0.8}
                                />
                            )}

                            <Marker position={userLocation}>
                                <Popup>
                                    <div className="text-center">
                                        <p className="font-semibold">Current Location</p>
                                    </div>
                                </Popup>
                            </Marker>

                            {crimeData?.features?.map((feature, idx) => {
                                const [lon, lat] = feature.geometry.coordinates;
                                return (
                                    <Circle
                                        key={idx}
                                        center={[lat, lon]}
                                        radius={300}
                                        pathOptions={{
                                            color: feature.properties.color,
                                            fillColor: feature.properties.color,
                                            fillOpacity: 0.3
                                        }}
                                    />
                                );
                            })}
                        </MapContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-400 animate-pulse">Locating satellites...</p>
                        </div>
                    )}
                </div>

                {/* Bottom Panel: Instructions & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Navigation Instructions */}
                    <div className="md:col-span-2 glass-card p-6 flex flex-col justify-center min-h-[150px]">
                        {isNavigating ? (
                            <div className="flex items-start gap-4">
                                <div className="bg-electric-blue/20 p-3 rounded-full">
                                    <Navigation className="w-8 h-8 text-electric-blue" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-2">{currentInstructionText}</h2>
                                    {nextInstructionText && (
                                        <p className="text-gray-400 flex items-center gap-2">
                                            <span className="text-xs uppercase tracking-wider text-gray-500">Next</span>
                                            {nextInstructionText}
                                        </p>
                                    )}
                                    <div className="mt-4 bg-navy-medium h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-electric-blue h-full transition-all duration-500"
                                            style={{ width: `${(currentRouteIndex / (routePath?.length || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400">
                                <p className="text-lg">Enter a destination to start navigation</p>
                                <p className="text-sm opacity-60">Use arrow keys to simulate movement in this demo</p>
                            </div>
                        )}
                    </div>

                    {/* Status & Alerts */}
                    <div className="space-y-4">
                        {/* Risk Status */}
                        <div className={`glass-card p-4 border-l-4 ${riskLevel === 'high' ? 'border-danger-red' :
                            riskLevel === 'medium' ? 'border-amber-warning' : 'border-emerald'
                            }`}>
                            <div className="flex items-center gap-3">
                                <AlertTriangle className={`w-6 h-6 ${riskLevel === 'high' ? 'text-danger-red' :
                                    riskLevel === 'medium' ? 'text-amber-warning' : 'text-emerald'
                                    }`} />
                                <div>
                                    <h3 className="font-bold text-white">{getRiskText(riskLevel)}</h3>
                                    <p className="text-xs text-gray-400">Current Zone Status</p>
                                </div>
                            </div>
                        </div>

                        {/* Emergencies */}
                        {emergencyActive && (
                            <div className="glass-card p-4 border-l-4 border-electric-blue">
                                <div className="flex items-center gap-2 mb-2">
                                    <Bell className="w-5 h-5 text-electric-blue animate-bounce" />
                                    <h3 className="font-bold text-white">Active Emergency</h3>
                                </div>
                                <p className="text-sm text-gray-300">Responders notified. Stay safe.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Emergency Button */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={handleEmergencyRequest}
                    disabled={emergencyActive}
                    className={`btn-danger text-xl px-8 py-6 rounded-full shadow-glow-red transform transition-transform hover:scale-105 ${emergencyActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <AlertTriangle className="w-8 h-8 inline" />
                </button>
            </div>
        </div>
    );
}

export default Dashboard;
