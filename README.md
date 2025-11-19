# 114 - HW4 - CT5805701 - Software Engineering

## Student Information
| Name | Student ID |
|------|-------------|
| ISHAQ ADHELTYO | M11402805 |
| 王紹帆 | M11405505 |
| CORNELIUS JEFFERSON TJAHJONO | M11405806 |

## Organization Chart of Planned Website
```mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor':'#2d5016','primaryTextColor':'#fff','primaryBorderColor':'#7c3aed','lineColor':'#4ade80','secondaryColor':'#1e3a8a','tertiaryColor':'#7c2d12'}}}%%

flowchart LR
    %% Style Definitions
    classDef website fill:#1e3a5a,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef publicSite fill:#2d3a1f,stroke:#a3a847,stroke-width:3px,color:#fff
    classDef appSite fill:#1e3a5a,stroke:#3b82f6,stroke-width:3px,color:#fff
    classDef greenBox fill:#2d5016,stroke:#4ade80,stroke-width:2px,color:#fff
    classDef yellowBox fill:#5a4f1f,stroke:#fbbf24,stroke-width:2px,color:#fff
    classDef redBox fill:#5a1f1f,stroke:#ef4444,stroke-width:2px,color:#fff
    classDef loginBox fill:#2d5016,stroke:#4ade80,stroke-width:3px,color:#fff
    
    %% Main Entry
    A[NovaSphere<br/>Website]:::website
    
    %% Public Marketing Site Section
    subgraph Public[" PUBLIC MARKETING SITE "]
        B1["🏠<br/>Homepage<br/>(Jefferson)"]:::greenBox
        B2["📄<br/>Features Page<br/>(Jefferson)"]:::yellowBox
        B3["💲<br/>Pricing Page<br/>(王紹帆)"]:::yellowBox
        B4["👤<br/>About Us<br/>"]:::redBox
        B5["✉️<br/>Contact Page<br/>"]:::redBox
        L["🔐<br/>Login or Sign Up<br/>(Ishaq)"]:::loginBox
    end
    
    %% Application Section
    subgraph App[" NOVASPHERE APPLICATION "]
        D["🎛️<br/>Dashboard<br/>(Jefferson)"]:::loginBox
        
        P1["📁<br/>Project<br/>Management<br/>(Jefferson)"]:::greenBox
        P1_List["📋<br/>List Projects<br/>(Jefferson)"]:::greenBox
        P1_View["👁️<br/>View Project<br/>(Jefferson)"]:::greenBox
        P1_View_Project_Form["🗂️<br/>Project Details<br/>(Jefferson)"]:::greenBox
        P1_View_Project_Task["✅<br/>Project Task Management<br/>(Jefferson)"]:::greenBox
        P1_View_Project_Material["📦<br/>Project Materials Management<br/>(王紹帆)"]:::greenBox
        P1_View_Project_Material_S1["⭐<br/>Supplier Rating<br/>Basic<br/>(Ishaq)"]:::greenBox
        P1_Create["➕<br/>Create Project<br/>(Jefferson)"]:::greenBox
        P1_Edit["✏️<br/>Edit Project<br/>(Jefferson)"]:::greenBox
        
        P2["🏢<br/>Supplier<br/>Management<br/>(王紹帆)"]:::greenBox
        P2_List["📋<br/>List Suppliers<br/>(王紹帆)"]:::greenBox
        P2_View["👁️<br/>View Supplier<br/>(王紹帆)"]:::greenBox
        P2_Create["➕<br/>Add Supplier<br/>(王紹帆)"]:::greenBox
        P2_Edit["✏️<br/>Edit Supplier<br/>(王紹帆)"]:::greenBox
        
        P3["📦<br/>Material<br/>Management<br/>(Ishaq)"]:::greenBox
        P3_List["📋<br/>List Materials<br/>(Ishaq)"]:::greenBox
        P3_View["👁️<br/>View Material<br/>(Ishaq)"]:::greenBox
        P3_Create["➕<br/>Create Material<br/>(Ishaq)"]:::greenBox
        P3_Edit["✏️<br/>Edit Material<br/>(Ishaq)"]:::greenBox
        
        P4["⚙️<br/>Settings and<br/>User<br/>Management<br/>(Ishaq)"]:::greenBox
        P4_List["📋<br/>List Users<br/>(Ishaq)"]:::greenBox
        P4_View["👁️<br/>View User<br/>(Ishaq)"]:::greenBox
        P4_Create["➕<br/>Create User<br/>(Ishaq)"]:::greenBox
        P4_Edit["✏️<br/>Edit User<br/>(Ishaq)"]:::greenBox
        
        P5["📊<br/>Reporting and<br/>Analytics<br/>(王紹帆)"]:::greenBox
        R1["📋<br/>Basic Reports<br/>(王紹帆)"]:::greenBox
        R1_Advance_Supplier_Performance["🎯 Advanced Supplier Performance Analytics<br/>"]:::redBox
        R1_Predictive_Delay_Alert["⚡ AI-driven Predictive Delay Alerts<br/>"]:::redBox
        R1_In_Depth_Performance["📈 In-depth Performance Analytics<br/>"]:::redBox

    end
    
    %% Connections
    A --> Public
    
    L --> D
    
    D --> P1
    D --> P2
    D --> P3
    D --> P4
    D --> P5
    
    P1 --> P1_List
    P1 --> P1_View
    P1_View --> P1_View_Project_Form
    P1_View --> P1_View_Project_Task
    P1_View --> P1_View_Project_Material
    P1_View_Project_Material --> P1_View_Project_Material_S1
    P1 --> P1_Create
    P1 --> P1_Edit
    
    P2 --> P2_List
    P2 --> P2_View
    P2 --> P2_Create
    P2 --> P2_Edit
    
    P3 --> P3_List
    P3 --> P3_View
    P3 --> P3_Create
    P3 --> P3_Edit
    
    P4 --> P4_List
    P4 --> P4_View
    P4 --> P4_Create
    P4 --> P4_Edit
    
    P5 --> R1
    P5 --> R1_Advance_Supplier_Performance
    P5 --> R1_Predictive_Delay_Alert
    P5 --> R1_In_Depth_Performance
    
    %% Apply styles to subgraphs
    style Public fill:#2d3a1f,stroke:#a3a847,stroke-width:3px,color:#e5e5e5
    style App fill:#1e3a5a,stroke:#3b82f6,stroke-width:3px,color:#e5e5e5
```
- 🟢 **High Priority (MVP - Phase 1)**  
  Green boxes: core features required for basic system operation.

- 🟡 **Medium Priority (Phase 2)**  
  Yellow boxes: features that enhance user experience and system completeness.

- 🔴 **Low Priority (Phase 3)**
  Red boxes: advanced AI-driven analytics and reporting features.

---

# Novasphere Application - Technical Documentation

A full-stack web application for managing construction suppliers, built with Express.js, MySQL, and Bootstrap 5.

## Tech Stack

- **Backend**: Express.js (Node.js)
- **Frontend**: HJS (Hogan.js templating), Bootstrap 5, HTMX
- **Database**: MySQL 8.0
- **Session Management**: express-session with cookies
- **Authentication**: bcrypt for password hashing

## Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Docker and Docker Compose (for containerized setup)
- MySQL 8.0 (for local development without Docker)

## Project Structure

```
novasphere/
├── src/
│   ├── config/              # Configuration files
│   ├── controllers/         # Base controller class
│   ├── middlewares/         # Authentication middleware
│   ├── modules/             # Feature modules
│   ├── repositories/        # Database Repo
│   ├── routes/              # Main router
│   ├── script/              # Migration and seed scripts
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── views/               # HJS templates
│   ├── public/              # Static assets (css, js, images)
│   └── index.js             # Main application entry
├── documentation/           # ERD and use case diagrams
└── docker-compose files     # Docker configurations
```

## Installation

### Option 1: Local Development (with Docker for MySQL only)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start MySQL container**
   ```bash
   docker-compose -f docker-compose-local.yml up -d
   ```

3. **Configure environment**
   - The `.env` file is already configured
   - Update database credentials if needed

4. **Run migrations and seeds**
   ```bash
   npm run migrate
   npm run seed
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - URL: http://localhost:3000
   - Default credentials: `admin@example.com` / `admin123`

### Option 2: Full Docker Development Environment

1. **Build and start containers**
   ```bash
   docker-compose -f docker-compose-dev.yml up --build
   ```

2. **Access the container and run migrations**
   ```bash
   docker exec -it novasphere-app-dev sh
   npm run migrate
   npm run seed
   exit
   ```

3. **Access the application**
   - URL: http://localhost:3000
   - Default credentials: `admin@example.com` / `admin123`

## Available Scripts

- `npm start` - Start the application in production mode
- `npm run dev` - Start the application in development mode with watch
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed the database with initial data
- `npm run db:reset` - Reset database (migrate + seed)
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
APP_NAME=Novasphere

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=novasphere_db

# Session
SESSION_SECRET=novasphere-secret-key-development-only
SESSION_MAX_AGE=86400000
```

## Default Login Credentials

- **Email**: admin@example.com
- **Password**: admin123

## Docker Commands

### Local MySQL Only
```bash
# Start MySQL
docker-compose -f docker-compose-local.yml up -d

# Stop MySQL
docker-compose -f docker-compose-local.yml down

# View logs
docker-compose -f docker-compose-local.yml logs -f
```

### Full Development Environment
```bash
# Start all services
docker-compose -f docker-compose-dev.yml up --build

# Stop all services
docker-compose -f docker-compose-dev.yml down

# View logs
docker-compose -f docker-compose-dev.yml logs -f app

# Rebuild
docker-compose -f docker-compose-dev.yml up --build --force-recreate
```

## Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **2 spaces** for indentation
- **ESM modules** (import/export)
- **Class-based** architecture

## Import Strategy

The project uses **relative imports** throughout the codebase for maximum compatibility with Node.js ESM:

```javascript
// From src/index.js
import appConfig from './config/app/index.js';
import databaseService from './services/database/index.js';

// From src/modules/auth/service.js
import userRepository from '../../repositories/user/index.js';
```

## Development Guidelines

1. **Follow the repository pattern** - All database queries go through repositories
2. **Use services for business logic** - Controllers should be thin
3. **Validate input** - Use the BaseService `validateRequired` method
4. **Handle errors properly** - Use try-catch blocks and proper error messages
5. **Keep views simple** - Minimal logic in templates

## Troubleshooting

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Database connection refused
- Ensure MySQL container is running: `docker ps`
- Check database credentials in `.env`
- Verify MySQL is accessible: `docker-compose -f docker-compose-local.yml logs mysql`

### Migration errors
```bash
# Reset the database
docker-compose -f docker-compose-local.yml down -v
docker-compose -f docker-compose-local.yml up -d
npm run migrate
npm run seed
```