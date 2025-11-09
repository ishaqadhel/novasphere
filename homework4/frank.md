# Construction Supplier Management System - Website Organization

## Priority Legend

- 🟢 **High Priority (MVP - Phase 1)**  
  Green boxes: core features required for basic system operation.

- 🟡 **Medium Priority (Phase 2)**  
  Yellow boxes: features that enhance user experience and system completeness.

- 🔴 **Low Priority (Phase 3)**  
  Red boxes: advanced AI-driven analytics and reporting features.


```mermaid
%%{init: {
  'theme':'base',
  'flowchart': {
    'nodeSpacing': 50,
    'rankSpacing': 120
  },
  'themeVariables': {
    'primaryColor':'#ffffff',
    'primaryTextColor':'#111827',
    'primaryBorderColor':'#000000',
    'lineColor':'#000000',
    'secondaryColor':'#ffffff',
    'tertiaryColor':'#ffffff',
    'background':'#ffffff',
    'fontSize': '20px',
    'fontFamily': 'Arial'
  }
}}%%

flowchart TB
    %% Priority Color Boxes (colored fill + black border)
    %% 🟢 Phase 1 - High Priority
    classDef greenBox fill:#dcfce7,stroke:#000000,stroke-width:1px,color:#111827
    
    %% 🟡 Phase 2 - Medium Priority
    classDef yellowBox fill:#fef9c3,stroke:#000000,stroke-width:1px,color:#111827
    
    %% 🔴 Phase 3 - Low Priority
    classDef redBox fill:#fee2e2,stroke:#000000,stroke-width:1px,color:#111827
    
    %% Special Types (white background + black border)
    classDef website fill:#ffffff,stroke:#000000,stroke-width:2px,color:#111827
    classDef loginBox fill:#ffffff,stroke:#000000,stroke-width:2px,color:#111827
    classDef roleBox fill:#ffffff,stroke:#000000,stroke-width:1px,color:#111827
    
    %% Main Entry
    A[Construction Supplier<br/>Management System]:::website
    
    %% Public Site Section
    subgraph Public["🌐 PUBLIC WEBSITE"]
        B1["🏠<br/>Homepage<br/><br/>System Introduction & Highlights"]:::greenBox
        B2["📖<br/>Features<br/><br/>Core Feature Overview"]:::yellowBox
        B3["💰<br/>Pricing<br/><br/>Subscription Plans"]:::yellowBox
        B4["👥<br/>About Us<br/><br/>Company Information"]:::redBox
        B5["📧<br/>Contact Us<br/><br/>Customer Support"]:::redBox
        L["🔐<br/>Login / Sign Up<br/><br/>User Authentication"]:::loginBox
    end
    
    %% Main Application Dashboard
    subgraph MainApp["🎯 MAIN APPLICATION"]
        D["📊<br/>Dashboard<br/><br/>System Overview & Quick Access"]:::loginBox
    end
    
    %% Administrator Module
    subgraph AdminModule["👨‍💼 ADMINISTRATOR MODULE"]
        direction TB
        
        subgraph UserMgmt["👤 User Management"]
            UC1["➕<br/>Create Employee Account"]:::greenBox
            UC2["✏️<br/>Modify Employee Account"]:::greenBox
            UC3["🗑️<br/>Delete Employee Account"]:::greenBox
            UC4["🔑<br/>Assign Roles & Permissions"]:::greenBox
        end
        
        subgraph SupplierMgmtAdmin["🏢 Supplier Management"]
            UC5["➕<br/>Add Supplier"]:::greenBox
            UC6["✏️<br/>Edit Supplier Information"]:::greenBox
            UC7["🗑️<br/>Delete Supplier"]:::yellowBox
        end
    end
    
    %% Project Manager Module
    subgraph PMModule["📋 PROJECT MANAGER MODULE"]
        direction TB
        
        subgraph ProjectMgmt["🏗️ Project Management"]
            UC8["➕<br/>Create Project"]:::greenBox
            UC9["📈<br/>Manage & Track Project"]:::greenBox
            UC10["🎯<br/>Assign Resources & Tasks"]:::greenBox
        end
        
        subgraph SupplierRatingPM["⭐ Supplier Rating"]
            UC15PM["⭐<br/>Rate Suppliers"]:::greenBox
            UC16PM["📜<br/>Review Supplier Performance History"]:::greenBox
            UC18["📊<br/>Benchmark Supplier Performance"]:::yellowBox
        end
        
        subgraph ReportingPM["📊 Reporting & Analytics"]
            UC19PM["📄<br/>Generate Basic Reports"]:::greenBox
        end
    end
    
    %% Supervisor Module
    subgraph SupModule["👷 SUPERVISOR MODULE"]
        direction TB
        
        subgraph MaterialMgmt["📦 Material Management"]
            UC11["📝<br/>Manage Material Requirements"]:::greenBox
            UC12["🚚<br/>Track Ordering & Delivery"]:::greenBox
            UC13["✅<br/>Verify Material Quality"]:::greenBox
            UC14["⚠️<br/>Mark Non-compliant Materials"]:::greenBox
        end
        
        subgraph SupplierRatingSup["⭐ Supplier Rating"]
            UC15Sup["⭐<br/>Rate Suppliers"]:::greenBox
            UC16Sup["📜<br/>Review Supplier Performance History"]:::greenBox
        end
        
        subgraph ReportingSup["📊 Reporting & Analytics"]
            UC19Sup["📄<br/>Generate Basic Reports"]:::greenBox
        end
    end
    
    %% AI Service Module (Advanced Features)
    subgraph AIModule["🤖 SMART REPORT SERVICE (AI)"]
        direction TB
        UC17["🎯<br/>Advanced Supplier Performance Analytics"]:::redBox
        UC20["⚡<br/>AI-driven Predictive Delay Alerts"]:::redBox
        UC21["📈<br/>In-depth Performance Analytics"]:::redBox
    end
    
    %% Main Connections
    A --> Public
    Public --> L
    L --> D
    
    D --> AdminModule
    D --> PMModule
    D --> SupModule
    D -.-> AIModule
    
    %% Internal Connections - Admin
    AdminModule --> UserMgmt
    AdminModule --> SupplierMgmtAdmin
    
    %% Internal Connections - PM
    PMModule --> ProjectMgmt
    PMModule --> SupplierRatingPM
    PMModule --> ReportingPM
    
    %% Internal Connections - Supervisor
    SupModule --> MaterialMgmt
    SupModule --> SupplierRatingSup
    SupModule --> ReportingSup
    
    %% AI Service Connections
    SupplierRatingPM -.-> UC17
    ReportingPM -.-> UC20
    ReportingPM -.-> UC21
    
    %% Subgraph styles: white background + black border
    style Public fill:#ffffff,stroke:#000000,stroke-width:2px,color:#111827
    style MainApp fill:#ffffff,stroke:#000000,stroke-width:2px,color:#111827
    style AdminModule fill:#ffffff,stroke:#000000,stroke-width:2px,color:#111827
    style PMModule fill:#ffffff,stroke:#000000,stroke-width:2px,color:#111827
    style SupModule fill:#ffffff,stroke:#000000,stroke-width:2px,color:#111827
    style AIModule fill:#ffffff,stroke:#000000,stroke-width:2px,color:#111827
    style UserMgmt fill:#ffffff,stroke:#000000,stroke-width:1px,color:#111827
    style SupplierMgmtAdmin fill:#ffffff,stroke:#000000,stroke-width:1px,color:#111827
    style ProjectMgmt fill:#ffffff,stroke:#000000,stroke-width:1px,color:#111827
    style SupplierRatingPM fill:#ffffff,stroke:#000000,stroke-width:1px,color:#111827
    style ReportingPM fill:#ffffff,stroke:#000000,stroke-width:1px,color:#111827
    style MaterialMgmt fill:#ffffff,stroke:#000000,stroke-width:1px,color:#111827
    style SupplierRatingSup fill:#ffffff,stroke:#000000,stroke-width:1px,color:#111827
    style ReportingSup fill:#ffffff,stroke:#000000,stroke-width:1px,color:#111827
