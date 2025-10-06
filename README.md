# VYGEO OPALENA - Digital Twin Ski Resort

A professional interactive map application for the Opalena ski resort featuring real-time weather data, sheep counting, and geographic tools.

## 🏗️ Project Structure

```
VYGEO/
├── index.html                 # Main HTML file (clean, minimal)
├── README.md                  # This documentation
├── assets/                    # Static assets
│   ├── css/                   # Stylesheets
│   │   ├── leaflet.css
│   │   ├── visual.css
│   │   └── style.css
│   ├── icons/                 # SVG icons
│   ├── images/                # Images and photos
│   └── models/                # 3D models (GLB, PLY)
├── js/                        # JavaScript modules
│   ├── modules/               # Application modules
│   │   ├── config.js          # Configuration constants
│   │   ├── map.js             # Leaflet map management
│   │   ├── features.js        # Drawing and feature management
│   │   ├── weather.js         # Weather data and display
│   │   ├── sheep-counter.js   # Sheep counting functionality
│   │   ├── auth.js            # Authentication management
│   │   ├── graph.js           # Statistics and charts
│   │   └── app.js             # Main application orchestrator
│   └── libs/                  # External libraries (if needed)
├── api/                       # PHP backend
│   ├── auth.php               # Authentication endpoints
│   ├── get_sheep.php          # Sheep count API
│   ├── features.php           # Feature management API
│   └── update.php             # Data update endpoints
├── scripts/                   # Python scripts
│   ├── sheep_counter.py       # Sheep counting algorithm
│   ├── get_sheep.py           # Data retrieval
│   └── send_test.py           # Test data sender
├── data/                      # JSON data files
│   └── sheep.json             # Sheep count data
└── tiles/                     # Map tiles
    └── [zoom levels]/         # Organized by zoom level
```

## 🚀 Features

### Core Functionality
- **Interactive Map**: Leaflet-based map with multiple base layers
- **Real-time Weather**: Live temperature and weather data from OpenWeatherMap
- **Sheep Counter**: Real-time counting of sheep on slopes with color-coded lifts
- **Drawing Tools**: Create, edit, and manage map features (points, lines, polygons)
- **Authentication**: User login/logout system
- **Statistics**: Historical data visualization with Chart.js

### Technical Features
- **Modular Architecture**: Clean separation of concerns
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live data updates every 2 seconds
- **Geographic Calculations**: Distance and area measurements
- **Video Streaming**: HLS webcam integration
- **Database Integration**: MySQL backend for data persistence

## 🛠️ Installation & Setup

### Prerequisites
- Web server (Apache/Nginx) or XAMPP
- PHP 7.4+ with MySQL extension
- Python 3.7+ (for sheep counting scripts)
- Modern web browser with JavaScript enabled

### Local Development (XAMPP)
1. Clone/download the project to your XAMPP `htdocs` folder
2. Import the database schema (if provided)
3. Configure database connection in PHP files
4. Start XAMPP services
5. Open `http://localhost/VYGEO` in your browser

### Production Deployment
1. Upload all files to your web server
2. Configure web server to serve the application
3. Set up database and update connection strings
4. Ensure proper file permissions
5. Configure SSL certificate for HTTPS

## 📁 Module Documentation

### Core Modules

#### `config.js`
Central configuration file containing:
- Map coordinates and API keys
- Update intervals and thresholds
- Color schemes for different states
- API endpoints and URLs

#### `map.js` (MapManager)
Handles all map-related functionality:
- Leaflet map initialization
- Base layer management (Mapy.cz, orthophoto)
- Overlay layers (webcams, lifts, features)
- Map controls and event handling
- Video player integration

#### `features.js` (FeaturesManager)
Manages drawing tools and map features:
- Leaflet.draw integration
- Feature creation, editing, deletion
- Geometric calculations (area, length)
- Database synchronization
- Popup management

#### `weather.js` (WeatherManager)
Weather data and display management:
- OpenWeatherMap API integration
- Live temperature updates
- Weather dashboard UI
- Forecast display
- Demo data fallback

#### `sheep-counter.js` (SheepCounter)
Real-time sheep counting system:
- Periodic data fetching
- Lift color coding based on sheep count
- UI updates for counters
- Historical data integration

#### `auth.js` (AuthManager)
User authentication system:
- Login/logout functionality
- Session management
- CSRF protection
- UI state management

#### `graph.js` (GraphManager)
Statistics and data visualization:
- Chart.js integration
- Historical data display
- Modal management
- Statistical calculations

#### `app.js` (VYGEOApp)
Main application orchestrator:
- Module initialization
- Event listener setup
- Cross-module communication
- Error handling

## 🔧 Configuration

### API Keys
Update the following in `js/modules/config.js`:
```javascript
const CONFIG = {
  MAPY_CZ_API_KEY: 'your_mapy_cz_key',
  OPENWEATHER_API_KEY: 'your_openweather_key',
  // ... other settings
};
```

### Database Configuration
Update database settings in PHP files:
```php
$host = 'localhost';
$dbname = 'vygeo';
$username = 'your_username';
$password = 'your_password';
```

### Update Intervals
Modify update intervals in `config.js`:
```javascript
SHEEP_UPDATE_INTERVAL: 2000,    // 2 seconds
TEMP_UPDATE_INTERVAL: 300000,   // 5 minutes
```

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📱 Mobile Support

The application is fully responsive and works on:
- iOS Safari 13+
- Android Chrome 80+
- Mobile Firefox 75+

## 🔒 Security Considerations

- CSRF protection implemented
- Input validation on all forms
- SQL injection prevention
- XSS protection
- Secure session management

## 🐛 Troubleshooting

### Common Issues

1. **Map not loading**: Check API keys and network connectivity
2. **Sheep counter not updating**: Verify PHP backend and database connection
3. **Weather data not showing**: Check OpenWeatherMap API key and quota
4. **Drawing tools not working**: Ensure Leaflet.draw library is loaded

### Debug Mode
Enable console logging by opening browser developer tools and checking the console for error messages.

## 📄 License

This project is open-source and available under the MIT License.

## 👨‍💻 Author

**Petr Mikeska**
- Website: [petrmikeska.cz](https://petrmikeska.cz)
- Email: [contact information]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For technical support or questions, please contact the author or create an issue in the project repository.

---

**VYGEO OPALENA** - Professional ski resort digital twin solution