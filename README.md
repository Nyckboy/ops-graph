# 🛡️ OpsGuard: IAM & DevOps Graph Explorer

**OpsGuard** is an experimental dashboard designed to demonstrate how **Graph Databases (Neo4j)** can solve complex DevOps problems—specifically **Identity & Access Management (IAM)**.

> ⚠️ **Note:** This is a purely experimental project created to learn and test Neo4j, Docker, and Graph Theory concepts. It is not intended for production use.

## 💡 The Problem

In traditional SQL databases, answering questions like _"Who has indirect access to the Production Database?"_ requires complex, slow `JOIN` operations. Permissions are often nested (User -> Group -> Role -> Server), making "Blast Radius" calculations difficult.

## 🚀 The Solution

OpsGuard uses a Graph Database to "walk" these relationships instantly.

- **Effective Permissions:** Calculates actual access by traversing the graph.
- **Real-World Sync:** Connects to the **GitHub API** to ingest real contributors and simulate their access levels based on contribution activity.
- **Risk Analysis:** Automatically flags "High Risk" users (e.g., those with `CAN_DELETE` privileges).

## 🛠️ Tech Stack

- **Database:** Neo4j (Graph Database)
- **Backend:** Node.js, Express
- **Frontend:** React, Tailwind CSS
- **Infrastructure:** Docker, Docker Compose, Nginx

## 📸 Architecture

[Browser] <--> [Nginx/React Container] <--> [Node.js API Container] <--> [Neo4j Container] <--> [GitHub API]

## ⚡ Quick Start (Docker)

The easiest way to run this project is with Docker. You do not need Node.js or Neo4j installed on your machine.

**Prerequisites:**

- Docker & Docker Compose installed.

**1. Clone the Repository**

```bash
git clone [https://github.com/YOUR_USERNAME/opsguard.git](https://github.com/YOUR_USERNAME/opsguard.git)
cd opsguard
```

**2. Run the Stack**

```bash
docker-compose up --build
```

This command will fetch the Neo4j image, build the backend, build the frontend, and create a private network.

**3. Access the App**

Dashboard: http://localhost:8080

API: http://localhost:3000

Neo4j Browser: http://localhost:7474 (User: neo4j, Pass: password)

## 🕹️ How to Use

1.  **Open the Dashboard** at `http://localhost:8080`.
2.  **Sync Data:**
    - In the "Sync Real GitHub Data" box, enter a public repo (e.g., `facebook/react` or `torvalds/linux`).
    - Click **Import**.
    - _The backend will fetch live contributors and map them into the graph._
3.  **Audit Permissions:**
    - Click on any **User** in the list.
    - If the user has >500 contributions, they are assigned the **Maintainer** role (High Risk).
    - If fewer, they are a **Contributor** (Write Access only).
    - The "Risk Scorecard" will update instantly.

## 📂 Project Structure

```text
opsguard/
├── backend/            # Node.js Express API (The "Risk Engine")
├── frontend-cmdb/      # React + Tailwind Dashboard
├── docker-compose.yml  # Container Orchestration
└── README.md
```

## 🧪Learning Goals

Implementing Docker Multi-Stage Builds for React.

Connecting Node.js to Neo4j using the Bolt protocol.

Writing Cypher queries to traverse complex permission paths.

Created by [Mouad Abbassid] - 2025-2026
