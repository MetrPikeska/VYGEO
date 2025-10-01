# VYGEO - Ski Resort Management System

##  Overview

VYGEO is a professional web-based Geographic Information System (GIS) designed specifically for ski resort management. The application provides real-time monitoring of skier density, interactive mapping capabilities, and comprehensive data management tools for ski area operations.

##  Features

###  Interactive Mapping
- **Multiple Base Layers**: Mapy.cz (basic, winter, orthophoto, tourist), WMS relief, real estate cadastre
- **Custom Orthophoto**: High-resolution aerial imagery with precise positioning
- **Layer Management**: Dynamic layer switching with real-time updates
- **Scale Control**: Professional scale bar with metric and imperial units

###  Real-time Monitoring
- **Skier Density Tracking**: Live count of skiers on slopes
- **Dynamic Visualization**: Color-coded lift status based on skier density
  - Green: Normal capacity (0-1 skiers)
  - Orange: Moderate capacity (2-4 skiers)  
  - Red: High capacity (5+ skiers)
- **Historical Analytics**: Interactive charts and statistics
- **Live Webcam Integration**: Real-time video streaming from resort cameras

###  Professional GIS Tools
- **Drawing Tools**: Marker, polyline, polygon, and rectangle creation
- **Measurement Tools**: Distance and area calculation with precise metrics
- **Feature Management**: Create, edit, and delete geographic features
- **Data Persistence**: Secure database storage with user authentication
- **Export Capabilities**: GeoJSON format for data interoperability

###  Security & Access Control
- **User Authentication**: Secure login system with session management
- **Role-based Access**: Different permission levels for users
- **CSRF Protection**: Cross-site request forgery prevention
- **Data Ownership**: Users can only edit their own features
- **View-only Mode**: Public access for map viewing without editing rights

##  Installation

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx)
- Modern web browser with JavaScript enabled

### Database Setup
1. Create MySQL database:
```sql
CREATE DATABASE d383750_opalena CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Create required tables:
```sql
-- Main features table
CREATE TABLE map_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    geojson LONGTEXT NOT NULL,
    user_id VARCHAR(64) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Optional: Add user_id column if not exists
ALTER TABLE map_features ADD COLUMN user_id VARCHAR(64) NOT NULL DEFAULT 'admin';
```

### File Structure
```
vygeo/
├── index.html              # Main application interface
├── style.css               # Custom styling
├── visual.css              # Base visual styles
├── leaflet.css             # Leaflet mapping library styles
├── auth.php                # Authentication endpoints
├── auth_config.php         # User configuration
├── save_features.php       # Feature creation/update
├── delete_features.php     # Feature deletion
├── get_features.php        # Feature retrieval
├── get_sheep.php          # Skier count data
├── marker-icon.svg         # Custom marker icon
├── webcam.svg             # Webcam icon
├── bod_lokace.svg         # Location marker icon
├── menu.svg               # Menu icon
├── favicon.png            # Site favicon
└── {z}/{x}/{y}.png        # Custom orthophoto tiles
```

### Configuration

1. **Database Connection**: Update connection details in PHP files:
```php
$pdo = new PDO(
    "mysql:host=YOUR_HOST;dbname=YOUR_DB;charset=utf8mb4",
    "YOUR_USERNAME",
    "YOUR_PASSWORD"
);
```

2. **User Authentication**: Configure users in `auth_config.php`:
```php
return [
    'users' => [
        'admin' => password_hash('your_secure_password', PASSWORD_DEFAULT),
        'editor' => password_hash('another_password', PASSWORD_DEFAULT),
    ],
];
```

3. **API Keys**: Update Mapy.cz API key in `index.html`:
```javascript
const API_KEY = 'your_mapy_cz_api_key';
```

## 🎮 Usage

### For Public Users (View-only)
- Access the application without login
- View map with all public layers (lifts, pipes, webcams)
- Monitor real-time skier density
- Use zoom and pan controls
- View live webcam feeds

### For Authenticated Users
1. **Login**: Click "Přihlásit" button in top-right corner
2. **Drawing Tools**: Use left toolbar to create markers, lines, polygons
3. **Measurement**: Measure distances and areas with dedicated tools
4. **Feature Management**: View, edit, and delete saved features
5. **Data Export**: Access saved features through hamburger menu

### Drawing Features
1. Select drawing tool from left toolbar
2. Click on map to place markers or draw shapes
3. Enter feature name when prompted
4. Feature is automatically saved to database

### Measurement Tools
1. Select ruler tool for distance measurement
2. Select polygon tool for area measurement
3. Click on map to create measurement points
4. Results display automatically in popup

## 🔧 Technical Details

### Frontend Technologies
- **Leaflet.js**: Interactive mapping library
- **jQuery**: DOM manipulation and AJAX requests
- **Chart.js**: Data visualization and analytics
- **Video.js**: Webcam streaming integration
- **HLS.js**: HTTP Live Streaming support

### Backend Technologies
- **PHP**: Server-side processing and API endpoints
- **MySQL**: Data persistence and storage
- **PDO**: Database abstraction layer
- **JSON**: Data interchange format

### Security Features
- **Session Management**: Secure PHP sessions with HttpOnly cookies
- **CSRF Protection**: Token-based request validation
- **Input Validation**: Sanitized user inputs
- **SQL Injection Prevention**: Prepared statements
- **XSS Protection**: Output encoding and validation

## 📊 API Endpoints

### Authentication
- `POST auth.php?action=login` - User login
- `POST auth.php?action=logout` - User logout  
- `GET auth.php?action=status` - Check authentication status

### Features Management
- `POST save_features.php` - Create/update features
- `POST delete_features.php` - Delete features
- `GET get_features.php` - Retrieve all features

### Data Monitoring
- `GET get_sheep.php` - Get current skier count
- `GET get_sheep.php?history=1` - Get historical data

## 🎨 Customization

### Adding New Map Layers
```javascript
const newLayer = L.tileLayer('your_tile_url', {
    attribution: 'Your Attribution'
});
baseMaps["Your Layer"] = newLayer;
```

### Custom Icons
Replace SVG files in project root:
- `marker-icon.svg` - Default markers
- `webcam.svg` - Webcam locations
- `bod_lokace.svg` - User location

### Styling
Modify `style.css` for custom appearance:
- Toolbar button styles
- Modal window appearance
- Color schemes and themes

## 🐛 Troubleshooting

### Common Issues
1. **Features not loading**: Check database connection and user authentication
2. **Map tiles not displaying**: Verify API key and network connectivity
3. **Login not working**: Check `auth_config.php` user configuration
4. **Drawing tools hidden**: Ensure user is logged in

### Debug Mode
Enable browser developer tools to view console errors and network requests.

##  Performance Optimization

- **Tile Caching**: Implement browser caching for map tiles
- **Database Indexing**: Add indexes on frequently queried columns
- **Image Optimization**: Compress orthophoto tiles
- **CDN Integration**: Use content delivery network for static assets

##  Updates & Maintenance

### Regular Tasks
- Monitor database performance
- Update API keys as needed
- Backup feature data regularly
- Review user access logs

### Version Control
- Track changes with Git
- Tag stable releases
- Maintain changelog

##  Support

For technical support or feature requests, contact the development team.

##  License

This project is proprietary software developed for ski resort management. All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: 2025
**Developed by**: Petr Mikeska
