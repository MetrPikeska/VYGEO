# VYGEO Project Structure

## 📁 Folder Organization

```
VYGEO/
├── 📄 index.html                    # Clean, minimal HTML (200 lines)
├── 📄 README.md                     # Comprehensive documentation
├── 📄 PROJECT_STRUCTURE.md          # This file
│
├── 📁 assets/                       # Static assets
│   ├── 📁 css/                      # Stylesheets
│   │   ├── leaflet.css
│   │   ├── visual.css
│   │   └── style.css
│   ├── 📁 icons/                    # SVG icons
│   │   ├── marker-icon.svg
│   │   ├── webcam.svg
│   │   └── bod_lokace.svg
│   ├── 📁 images/                   # Images
│   │   ├── favicon.png
│   │   └── opalena_ortofoto.jpg
│   └── 📁 models/                   # 3D models
│       ├── dig_dvojce_opalena.glb
│       ├── dig_dvojce_opalena.ply
│       └── yolov8n.pt
│
├── 📁 js/                          # JavaScript modules
│   ├── 📁 modules/                 # Application modules
│   │   ├── 📄 config.js            # Configuration (41 lines)
│   │   ├── 📄 map.js               # Map management (153 lines)
│   │   ├── 📄 features.js          # Drawing tools (392 lines)
│   │   ├── 📄 weather.js           # Weather data (202 lines)
│   │   ├── 📄 sheep-counter.js     # Sheep counting (99 lines)
│   │   ├── 📄 auth.js              # Authentication (95 lines)
│   │   ├── 📄 graph.js             # Statistics (180 lines)
│   │   └── 📄 app.js               # Main orchestrator (120 lines)
│   └── 📁 libs/                    # External libraries (empty)
│
├── 📁 api/                         # PHP backend
│   ├── 📄 auth.php                 # Authentication
│   ├── 📄 get_sheep.php            # Sheep count API
│   ├── 📄 features.php             # Feature management
│   ├── 📄 update.php               # Data updates
│   └── 📄 [other PHP files]
│
├── 📁 scripts/                     # Python scripts
│   ├── 📄 sheep_counter.py         # Sheep counting algorithm
│   ├── 📄 get_sheep.py             # Data retrieval
│   └── 📄 send_test.py             # Test data
│
├── 📁 data/                        # JSON data files
│   └── 📄 sheep.json               # Sheep count data
│
└── 📁 tiles/                       # Map tiles
    ├── 📁 16/                      # Zoom level 16
    ├── 📁 17/                      # Zoom level 17
    ├── 📁 18/                      # Zoom level 18
    └── 📁 19/                      # Zoom level 19
```

## 🏗️ Architecture Overview

### Frontend (Client-side)
- **HTML**: Clean, semantic markup (200 lines vs. 1697 lines before)
- **CSS**: Modular stylesheets for different components
- **JavaScript**: Modular ES6 classes with clear separation of concerns

### Backend (Server-side)
- **PHP**: RESTful API endpoints for data management
- **Python**: Data processing and sheep counting algorithms
- **MySQL**: Database for persistent storage

### Key Improvements

#### ✅ **Modularity**
- Each feature has its own module
- Clear separation of concerns
- Easy to maintain and extend

#### ✅ **Maintainability**
- HTML reduced from 1697 to 200 lines
- JavaScript organized in logical modules
- Consistent code style and documentation

#### ✅ **Scalability**
- Easy to add new features
- Modular architecture supports team development
- Clear interfaces between modules

#### ✅ **Performance**
- Optimized loading order
- Minimal HTML footprint
- Efficient module loading

#### ✅ **Developer Experience**
- Comprehensive documentation
- Clear project structure
- Easy to understand and modify

## 🔄 Data Flow

```
User Interaction → App.js → Module Managers → APIs → Database
                ↓
            UI Updates ← Module Managers ← Data Processing
```

## 🎯 Module Responsibilities

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| `app.js` | Main orchestrator, event handling | All modules |
| `config.js` | Configuration constants | None |
| `map.js` | Map rendering, layers, controls | config.js |
| `features.js` | Drawing tools, feature management | map.js, config.js |
| `weather.js` | Weather data, temperature display | config.js |
| `sheep-counter.js` | Sheep counting, lift colors | map.js, config.js |
| `auth.js` | User authentication | config.js |
| `graph.js` | Statistics, charts | config.js |

## 🚀 Benefits of New Structure

1. **Reduced Complexity**: HTML file is 88% smaller
2. **Better Organization**: Clear folder structure
3. **Easier Maintenance**: Each module has single responsibility
4. **Team Development**: Multiple developers can work on different modules
5. **Testing**: Individual modules can be tested separately
6. **Documentation**: Comprehensive README and inline comments
7. **Scalability**: Easy to add new features without affecting existing code