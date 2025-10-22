# VYGEO OPALENA - Interactive Mapping Application

Interactive web application for managing geographical data with support for elevation data, weather, and GPS functionality.

## Features

- **Map Layer** - Interactive map with custom tiles
- **Object Management** - Creating, editing and deleting polygons, lines and points
- **Elevation Data** - Automatic elevation data retrieval from API
- **Weather** - Display of current temperature and weather conditions
- **GPS Functions** - Save current device location
- **Color Management** - Color selection for objects from predefined palette
- **Database** - Data storage in MySQL database
- **Wet-bulb Calculator** - Tool for determining snowmaking conditions
- **Layer Management** - Toggle visibility of map layers
- **Authentication** - Admin access to advanced functions
- **Photo Gallery** - Upload and display photos for map objects

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Leaflet.js
- **Backend**: PHP 7.4+
- **Database**: MySQL 5.7+
- **API**: RESTful API for data management
- **Security**: Protected API keys, CORS restrictions

## Project Structure

```
VYGEO/
├── api/                    # PHP API endpoints
│   ├── features.php        # Main API for features
│   ├── map_proxy.php       # Proxy for mapping API
│   ├── weather_proxy.php   # Proxy for weather API
│   ├── auth.php            # Authentication
│   ├── upload_photo.php    # API for photo uploads
│   ├── create_feature_photos_table.sql # SQL for creating photos table
│   └── db_config.php       # Database configuration
├── assets/                 # Static files
│   ├── icons/             # Icons
│   ├── images/            # Images
│   └── models/            # 3D models
├── css/                   # Styles
├── data/                  # Data files
├── tiles/                 # Map tiles
├── features.js            # Map object management (with photo functionality)
├── map.js                 # Map logic
├── weather.js             # Weather
├── wet-bulb-calculator.js # Wet-bulb temperature calculator
├── auth.js                # Authentication logic
├── app.js                 # Main application
├── test_photo_upload.html # Test interface for photo upload
├── index.html             # Main page
└── README.md
```

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/vasusername/VYGEO.git
cd VYGEO
```

### 2. Database Setup
```sql
CREATE DATABASE vygeo;
CREATE TABLE map_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    geojson TEXT,
    elevation_data TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Environment Configuration
Create `.env` file with your credentials:
```env
DB_HOST=localhost
DB_USER=username
DB_PASS=password
DB_NAME=vygeo
MAPY_CZ_API_KEY=your_api_key
OPENWEATHER_API_KEY=your_api_key
```

### 4. Download YOLO Model (Optional)
If you want to use the sheep counting feature, download the YOLO model:
```bash
# Download YOLOv8 model for sheep detection
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt
# Or download manually from: https://github.com/ultralytics/ultralytics
```

### 5. Running the Application
```bash
# PHP server
php -S localhost:8000

# Or use Apache/Nginx
```

## Usage

1. **Open** `index.html` in your browser
2. **Create objects** using tools on the right
3. **Select color** from palette when creating
4. **Save GPS position** using GPS button
5. **Manage objects** in the left panel
6. **Login as admin** for advanced functions
7. **Use wet-bulb calculator** for snowmaking

## API Endpoints

- `GET /api/features.php?action=list` - List all objects
- `POST /api/features.php` - Create new object
- `PUT /api/features.php` - Update object
- `DELETE /api/features.php?id=X` - Delete object
- `POST /api/auth.php` - Authentication
- `GET /api/map_proxy.php` - Proxy for map tiles
- `GET /api/weather_proxy.php` - Proxy for weather

## Security

- API keys are protected by proxy servers
- CORS is restricted to allowed domains
- Debug mode is disabled in production
- Database credentials are in .env file

## License

MIT License

## Pre-Implementation Analysis

### Project Overview
VYGEO OPALENA is a comprehensive interactive mapping application designed for geographical data management with specialized features for ski resort operations, particularly snowmaking optimization and weather monitoring.

### Technical Architecture Analysis

#### Frontend Architecture
- **Map Engine**: Leaflet.js for interactive mapping with custom tile support
- **UI Framework**: Vanilla JavaScript with modern ES6+ features
- **Styling**: CSS3 with responsive design principles
- **Data Visualization**: Custom charting for weather and elevation data

#### Backend Architecture
- **API Layer**: RESTful PHP endpoints for data management
- **Database**: MySQL with optimized schema for geographical data
- **Security**: Proxy-based API key protection and CORS implementation
- **File Management**: Secure photo upload and storage system

#### Key Technical Decisions
1. **Custom Tile System**: Pre-rendered map tiles for optimal performance
2. **Hybrid Data Storage**: Combination of local storage and database persistence
3. **API Proxy Pattern**: Secure external API integration
4. **Modular JavaScript**: Separation of concerns with dedicated modules

### Functional Requirements Analysis

#### Core Features
- **Geospatial Data Management**: CRUD operations for map features
- **Elevation Integration**: Real-time elevation data from external APIs
- **Weather Monitoring**: Current conditions and historical data
- **Photo Documentation**: Visual documentation of map features
- **Snowmaking Optimization**: Wet-bulb temperature calculations

#### Advanced Features
- **Layer Management**: Dynamic map layer toggling
- **Authentication System**: Role-based access control
- **GPS Integration**: Device location services
- **Color Coding**: Visual feature categorization

### Performance Considerations

#### Optimization Strategies
- **Tile Caching**: Pre-generated map tiles for fast loading
- **Lazy Loading**: On-demand feature loading
- **API Rate Limiting**: Controlled external API usage
- **Database Indexing**: Optimized queries for geographical data

#### Scalability Planning
- **Modular Architecture**: Easy feature addition
- **API Versioning**: Backward compatibility support
- **Database Partitioning**: Efficient data organization
- **Caching Strategy**: Redis integration potential

### Security Analysis

#### Data Protection
- **API Key Security**: Proxy-based key management
- **Input Validation**: SQL injection prevention
- **CORS Configuration**: Cross-origin request control
- **File Upload Security**: Type and size validation

#### Access Control
- **Authentication**: Secure login system
- **Authorization**: Role-based permissions
- **Session Management**: Secure user sessions
- **Data Encryption**: Sensitive data protection

### Integration Points

#### External Services
- **Mapping APIs**: Mapy.cz integration for Czech Republic
- **Weather APIs**: OpenWeatherMap for meteorological data
- **Elevation APIs**: Terrain height data services
- **GPS Services**: Device location integration

#### Data Flow Architecture
1. **User Input** → Frontend Validation → API Endpoints
2. **External APIs** → Proxy Servers → Application
3. **Database** → Caching Layer → Frontend Display
4. **File Uploads** → Security Validation → Storage

### Development Methodology

#### Implementation Phases
1. **Core Infrastructure**: Database setup and basic API
2. **Map Integration**: Leaflet.js implementation and custom tiles
3. **Feature Management**: CRUD operations for geographical objects
4. **Advanced Features**: Weather, elevation, and photo integration
5. **Security Implementation**: Authentication and authorization
6. **Performance Optimization**: Caching and loading improvements

#### Testing Strategy
- **Unit Testing**: Individual component validation
- **Integration Testing**: API endpoint verification
- **User Acceptance Testing**: Feature functionality validation
- **Performance Testing**: Load and stress testing

### Risk Assessment

#### Technical Risks
- **API Dependencies**: External service availability
- **Browser Compatibility**: Cross-platform support
- **Performance**: Large dataset handling
- **Security**: Data protection and access control

#### Mitigation Strategies
- **Fallback Systems**: Alternative data sources
- **Progressive Enhancement**: Graceful degradation
- **Caching**: Performance optimization
- **Security Audits**: Regular vulnerability assessments

## Author

Petr Mikeska - [petrmikeska.cz](https://petrmikeska.cz)