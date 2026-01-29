# SafeZone - Public Safety & Emergency Response Web App

A community-powered travel safety platform that combines real-time crime awareness with nearby human assistance.

## Features

- 🔐 **User Authentication**: Secure signup/login with JWT tokens
- 📍 **Live Location Tracking**: Continuous location updates every 10 seconds
- 🗺️ **Crime Density Map**: Visual representation of crime zones (red/amber/green)
- 🚨 **Emergency Requests**: One-click help requests to nearby volunteers
- 👥 **Volunteer Network**: Register as a volunteer to help others in need
- 🎨 **Modern Dark UI**: Futuristic design with glassmorphism and neon glows

## Tech Stack

**Frontend:**
- React 19 + Vite
- TailwindCSS (custom dark theme)
- React Leaflet (OpenStreetMap)
- Axios
- React Router
- Lucide React (icons)

**Backend:**
- FastAPI
- SQLAlchemy + SQLite
- JWT Authentication
- Bcrypt password hashing

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Mac/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:
```bash
uvicorn main:app --reload
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Sign Up**: Create a new account with your name, email, and password
2. **Grant Location Permission**: Allow the app to access your location for safety features
3. **View Dashboard**: See your location on the map with crime density zones
4. **Request Help**: Click the "REQUEST HELP" button in an emergency
5. **Become a Volunteer**: Register as a volunteer to help others in your area

### Volunteer Types

- Emergency Medical Responder
- Auxiliary Police Officer
- Crisis Intervention Specialist
- Medical Reserve Corps Volunteer
- Victim Advocate

## API Endpoints

### Authentication
- `POST /api/signup` - Create new account
- `POST /api/login` - Login to existing account

### Location
- `POST /api/location/update` - Update user location
- `GET /api/location/nearby` - Get nearby volunteers

### Volunteer
- `POST /api/volunteer/register` - Register as volunteer
- `PUT /api/volunteer/availability` - Update availability status

### Emergency
- `POST /api/emergency/request` - Create emergency request
- `POST /api/emergency/accept` - Accept emergency request
- `GET /api/emergency/active` - Get active emergency requests
- `GET /api/emergency/status/{id}` - Get emergency request status

### Crime Data
- `GET /api/crime/density` - Get crime density data for location

## Design Theme

- **Colors**: Navy/midnight blue backgrounds with electric blue accents
- **Typography**: Inter font family
- **Effects**: Glassmorphism cards, neon glows, smooth animations
- **Icons**: Line icons from Lucide React

## Security Notes

⚠️ **Important**: Change the `SECRET_KEY` in `backend/auth.py` before deploying to production!

## License

This project is for educational purposes.
