<div align="center">
  <h1>🚗 Ride — Inter-City Corridor Transit Platform</h1>
  <p><strong>Corridor-based ride-sharing, seat inventory, and security-first transit coordination platform designed for Northern Nigeria (Kaduna – Zaria – Kano).</strong></p>

  <p align="center">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
    <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Release-v1.0.0-blue?style=for-the-badge" />
  </p>
</div>

---

## 📖 Overview

**Ride** is an engineering-first inter-city transit coordination platform built specifically to solve the friction, security vulnerabilities, and scheduling unpredictability of interstate road travel in Northern Nigeria. 

Unlike conventional on-demand ride-hailing services that rely on arbitrary point-to-point routing, **Ride** utilizes a **Deterministic Corridor Engine** centered along defined transit corridors:
* **Kaduna ⇄ Zaria**
* **Zaria ⇄ Kano**
* **Kaduna ⇄ Kano**

---

## 🏗️ Core System Architecture

```
                 +-----------------------------------------+
                 |       Client Apps (Mobile / Web)        |
                 |     Expo React Native + Vite React      |
                 +--------------------+--------------------+
                                      | (JWT Bearer Auth)
                                      v
                 +-----------------------------------------+
                 |            Express API Gateway          |
                 |    Rate Limiting, RBAC & Validation     |
                 +--------------------+--------------------+
                                      |
         +----------------------------+----------------------------+
         |                            |                            |
         v                            v                            v
+------------------+         +------------------+         +------------------+
| Corridor Engine  |         | Seat Allocation  |         | Privacy Protocol |
| Point Clustering |         | Atomic Lock TTL  |         | Phased Reveal    |
+------------------+         +------------------+         +------------------+
         |                            |                            |
         +----------------------------+----------------------------+
                                      |
                                      v
                 +-----------------------------------------+
                 |       SQLite Transactional Store        |
                 |        WAL Mode + ACID Guarantees       |
                 +-----------------------------------------+
```

### 1. 🛡️ Meeting Point Privacy & Reveal Protocol
To protect passenger and driver safety on inter-city expressways:
* **Public Discovery:** Unauthenticated users and general searches only see approximate landmark regions (e.g., *Zaria Corridor: Kwangila Cluster*).
* **Booking State:** Exact GPS meeting coordinates, driver contact channels, and vehicle license details remain cryptographically locked until an authenticated seat reservation is confirmed and funded.

### 2. 💺 Real-Time Seat Allocation & Atomic Concurrency
* Employs time-to-live (TTL) reservation locks to prevent race conditions during high-volume departure windows.
* Enforces strict vehicle capacity controls (sedan 4-seat vs bus configurations) with automated expiration workers that release abandoned seats back into the live pool.

### 3. 👥 3-Tier Role-Based Governance
* **Passenger App:** Instant seat booking, digital boarding pass generation, trip progress tracking, and wallet funding.
* **Driver Workspace:** Manifest management, passenger onboarding verification, and trip departure sign-off.
* **Super Admin Console:** System-wide corridor metrics, dispute resolution, driver vetting, and financial reconciliation ledgers.

---

## 📂 Monorepo Structure

```
ride/
├── client/          # Mobile client application (Expo, React Native, TypeScript)
│   ├── src/screens/ # Auth, Corridor Booking, Driver Dashboard, Boarding Pass
│   └── src/theme.ts # High-contrast accessible design tokens
├── server/          # Backend API (Node.js, Express, TypeScript)
│   ├── src/controllers/ # Trip, Booking, Auth, Admin handlers
│   ├── src/database/    # SQLite schema, migration, seed scripts
│   └── src/services/    # Expiration worker, corridor routing engines
├── src/             # Web administration & landing portal (React, Vite, TypeScript)
├── Skills/          # Formal Architecture, Security & System Design Specifications
└── LICENSE          # Open-source MIT License
```

---

## ⚡ Quickstart & Local Setup

### Prerequisites
* **Node.js** >= 18.x
* **npm** or **yarn**

### 1. Clone the repository
```bash
git clone https://github.com/mubarakkasimmaishanu/Ride.git
cd Ride
```

### 2. Configure Backend Service
```bash
cd server
cp .env.example .env
npm install
npm run seed     # Seeds demo corridors, trips, and test credentials
npm run dev      # Boots API server on http://localhost:3000
```

### 3. Configure Mobile Client
```bash
cd ../client
npm install
npx expo start   # Launch Expo development server (Android / iOS / Web)
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.

---

<p align="center">
  Authored & Maintained by <a href="https://github.com/mubarakkasimmaishanu"><strong>Mubarak Kasim Mashanu</strong></a>
</p>
