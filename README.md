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
