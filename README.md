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