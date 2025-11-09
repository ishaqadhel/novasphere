# Novasphere - Construction Supplier Management System Website

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
        B1["🏠<br/>Homepage"]:::greenBox
        B2["📄<br/>Features Page"]:::yellowBox
        B3["💲<br/>Pricing Page"]:::yellowBox
        B4["👤<br/>About Us"]:::redBox
        B5["✉️<br/>Contact Page"]:::redBox
        L["🔐<br/>Login or Sign Up"]:::loginBox
    end
    
    %% Application Section
    subgraph App[" NOVASPHERE APPLICATION "]
        D["🎛️<br/>Dashboard"]:::loginBox
        
        P1["📁<br/>Project<br/>Management"]:::greenBox
        P2["🏢<br/>Supplier<br/>Management"]:::greenBox
        P3["📦<br/>Material<br/>Management"]:::greenBox
        P4["⚙️<br/>Settings and<br/>User<br/>Management"]:::greenBox
        P5["📊<br/>Reporting and<br/>Analytics"]:::greenBox
        
        S1["⭐<br/>Supplier Rating<br/>Basic"]:::greenBox
        R1["📋<br/>Basic Reports"]:::greenBox
    end
    
    %% Connections
    A --> Public
    
    L --> D
    
    D --> P1
    D --> P2
    D --> P3
    D --> P4
    D --> P5
    
    P2 --> S1
    P5 --> R1
    
    %% Apply styles to subgraphs
    style Public fill:#2d3a1f,stroke:#a3a847,stroke-width:3px,color:#e5e5e5
    style App fill:#1e3a5a,stroke:#3b82f6,stroke-width:3px,color:#e5e5e5
```

## Implementation Priority
- **High Priority: 🟩 Green Color**
- **Medium Priority: 🟨 Yellow Color**
- **Low Priority: 🟥 Red Color**

## Organization Chart Explanation - Website Features
**Public Marketing Site**
- 🏠Homepage (Landing Page)
- 📄Features Page (Service Explanation)
- 💲Pricing Page (Subscription Tiers)
- 👤About Us (Trinova Company)
- ✉️Contact Page
- 🔐Login or Sign Up (Access the Novasphere Application Section)

**Novasphere Application (Logged-In)**
- 🎛️Dashboard (Main User Entry Point and Project Overview)
- 📁Project Management
  - View All Projects
  - Create/Edit Project
  - Project Details (Tasks, Members, etc.)
  - Track Project Progress
- 🏢Supplier Management
  - View All Suppliers
  - Add/Edit Suppliers
  - Suppliers Detail
  - ⭐Supplier Rating Basic
  - Review Supplier Performance
- 📦Material Management
  - View Material Requirements
  - Track Ordering & Delivery
  - Verify Material Quality
- ⚙️Settings and User Management
  - User Profile
  - Manage Employee Accounts (Administrator)
  - Assign Roles & Permissions (Administrator)
- 📊Reporting and Analytics
  - 📋Basic Reports
 
## Project Development Responsibility
- **Ishaq:**
- **王紹帆/Frank:**
- **Cornelius:**
