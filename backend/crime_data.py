import random
import math
import os
from dotenv import load_dotenv
load_dotenv()  
from google import genai
from pydantic import BaseModel, Field
from typing import List, Optional
load_dotenv()
#gemini trigger
#Response Schema for gemini to get crime rate intensity
class CrimeIntensityResponse(BaseModel):
    intensity: str = Field(description="Intensity of crime rate in High,Low,moderate")
    crime_type: str= Field(description="Type of crime")
client = genai.Client()
def get_crime_intensity_gemini(lat, lon):
    try:
        prompt_text = f"""
        Analyze the crime safety for the location at Latitude: {lat}, Longitude: {lon}.
        Return the crime rate intensity (High, Medium, Low) and the type of crime most likely to happen.
        You should rarely return 'High' unless it is a known dangerous area.
        Most residential or standard urban areas should be 'Low' or 'Medium'.
        """
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_text,
            config={
                "response_mime_type": "application/json",
                "response_schema": CrimeIntensityResponse,
            },
        )
        
        # In the new SDK, parsed response might be directly available or via .parsed
        # But based on the user's code attempt, they used model_validate_json(response.text)
        # Let's check if the SDK returns an object we can use directly.
        # If response_schema is passed, response.parsed might be populated in some SDK versions
        # or we just parse response.text.
        
        if hasattr(response, 'parsed') and response.parsed:
            return response.parsed
            
        result = CrimeIntensityResponse.model_validate_json(response.text)
        print(f"Gemini Crime Result for ({lat}, {lon}): {result}")
        return result
        
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        # Fallback to safe default
        return CrimeIntensityResponse(intensity="Low", crime_type="None")
def generate_crime_density_data(lat, lon, radius=2000):
    """Generate mock crime density data as GeoJSON"""
    crime_zones = []
    
    # High risk zones (red)
    for _ in range(random.randint(2, 4)):
        offset_lat = random.uniform(-0.02, 0.02)
        offset_lon = random.uniform(-0.02, 0.02)
        crime_zones.append({
            "type": "Feature",
            "properties": {
                "risk_level": "high",
                "color": "#ef4444",
                "crime_types": ["Theft", "Assault", "Robbery"],
                "incident_count": random.randint(15, 30)
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lon + offset_lon, lat + offset_lat]
            }
        })
    
    # Medium risk zones (amber)
    for _ in range(random.randint(3, 6)):
        offset_lat = random.uniform(-0.03, 0.03)
        offset_lon = random.uniform(-0.03, 0.03)
        crime_zones.append({
            "type": "Feature",
            "properties": {
                "risk_level": "medium",
                "color": "#f59e0b",
                "crime_types": ["Vandalism", "Theft"],
                "incident_count": random.randint(5, 14)
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lon + offset_lon, lat + offset_lat]
            }
        })
    
    # Low risk zones (green)
    for _ in range(random.randint(4, 8)):
        offset_lat = random.uniform(-0.04, 0.04)
        offset_lon = random.uniform(-0.04, 0.04)
        crime_zones.append({
            "type": "Feature",
            "properties": {
                "risk_level": "low",
                "color": "#10b981",
                "crime_types": ["Minor incidents"],
                "incident_count": random.randint(1, 4)
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lon + offset_lon, lat + offset_lat]
            }
        })
    
    return {
        "type": "FeatureCollection",
        "features": crime_zones
    }

def get_risk_level_at_location(lat, lon, crime_data):
    """Determine risk level at location"""
    min_distance = float('inf')
    closest_zone = None
    
    for feature in crime_data['features']:
        zone_lon, zone_lat = feature['geometry']['coordinates']
        distance = calculate_distance(lat, lon, zone_lat, zone_lon)
        
        if distance < min_distance:
            min_distance = distance
            closest_zone = feature
    
    if min_distance < 200:
        return closest_zone['properties']['risk_level']
    elif min_distance < 500:
        risk = closest_zone['properties']['risk_level']
        if risk == 'high':
            return 'medium'
        elif risk == 'medium':
            return 'low'
    
    return 'safe'

def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine formula for distance calculation"""
    R = 6371e3
    φ1 = math.radians(lat1)
    φ2 = math.radians(lat2)
    Δφ = math.radians(lat2 - lat1)
    Δλ = math.radians(lon2 - lon1)

    a = math.sin(Δφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(Δλ / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c
