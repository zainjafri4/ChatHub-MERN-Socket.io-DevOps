<div align="center">

# 💬 ChatHub

### Real-Time Chat Application — Full Stack & Full DevOps

*MERN · Socket.io · Docker · Terraform · AWS ECS · GitHub Actions · Prometheus · Grafana*

<br/>

[![Backend CI/CD](https://img.shields.io/github/actions/workflow/status/zainjafri4/ChatHub-MERN-DevOps/backend.yml?label=Backend%20CI%2FCD&style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/zainjafri4/ChatHub-MERN-DevOps/actions/workflows/backend.yml)
[![Frontend CI/CD](https://img.shields.io/github/actions/workflow/status/zainjafri4/ChatHub-MERN-DevOps/frontend.yml?label=Frontend%20CI%2FCD&style=for-the-badge&logo=github-actions&logoColor=white&color=38bdf8)](https://github.com/zainjafri4/ChatHub-MERN-DevOps/actions/workflows/frontend.yml)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![AWS ECS](https://img.shields.io/badge/AWS-ECS%20EC2-FF9900?style=for-the-badge&logo=amazonecs&logoColor=white)](https://aws.amazon.com/ecs/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Grafana](https://img.shields.io/badge/Monitoring-Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)](https://grafana.com/)

<br/>

[![Node](https://img.shields.io/badge/Node.js-18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Overview

ChatHub is a **production-grade real-time messaging application** built to demonstrate an end-to-end DevOps workflow, from writing the application to containerizing, provisioning cloud infrastructure, setting up CI/CD, and observing it in production.

> Built as a **DevOps Engineer portfolio project** covering the complete software delivery lifecycle.

```
Code → Docker → ECR → ECS (EC2) → ALB → Users
         ↑                              ↑
   GitHub Actions CI/CD         Prometheus + Grafana
         ↑
   Terraform (AWS Infra)
```

---

## Application Features

<table>
<tr>
<td>

**💬 Messaging**
- Real-time 1-to-1 direct messages
- Group chats with admin controls
- Typing indicators
- Read receipts (sent / delivered / read)

</td>
<td>

**📨 Message Actions**
- Edit & delete (with time window)
- Reply / quote messages
- Emoji reactions
- Pin important messages
- Link preview cards

</td>
</tr>
<tr>
<td>

**👥 Groups**
- Public groups (discover & join)
- Private groups with invite links
- Admin role management
- Per-group notification settings

</td>
<td>

**🔐 Security**
- JWT in `httpOnly` cookies
- Refresh token rotation
- bcrypt (12 rounds)
- Rate limiting per endpoint
- Helmet.js HTTP headers

</td>
</tr>
<tr>
<td>

**📁 Media**
- Image, video, audio, document sharing
- Avatar uploads
- File compression before upload
- CDN-backed delivery

</td>
<td>

**🎨 UI/UX**
- Dark / Light / System theme
- Fully responsive layout
- Infinite scroll message history
- Animated transitions
- Empty states with illustrations

</td>
</tr>
</table>

---

## 🏗️ Architecture

### Cloud Infrastructure

```mermaid
graph TB
    User(["👤 User"])
    GH(["🔧 GitHub Actions\nCI/CD"])

    subgraph AWS ["☁️ AWS (Free Tier)"]
        subgraph VPC ["🔒 VPC — Public Subnet"]
            EIP["🌐 Elastic IP\n(free while attached)"]

            subgraph HOST ["🖥️ t2.micro EC2 — host network"]
                subgraph TASK ["ECS Task — chathub-app"]
                    NGINX["Nginx :80\nReverse Proxy + SPA"]
                    BE["Backend :5000\nExpress + Socket.io\n(internal only)"]
                end
                NGINX -->|proxy_pass\n127.0.0.1:5000| BE
            end
        end

        ECR["📦 ECR\n(500 MB free)"]
        CW["📋 CloudWatch Logs\n(5 GB free, 7-day retention)"]
    end

    subgraph EXT ["External Services"]
        MONGO[("🍃 MongoDB Atlas")]
        CLOUD["🖼️ Cloudinary\nMedia CDN"]
    end

    User -->|"HTTP :80 only"| EIP
    EIP --> NGINX
    GH -->|"backend.yml\nPush image → update backend container"| ECR
    GH -->|"frontend.yml\nPush image → update frontend container"| ECR
    ECR -->|Pull on deploy| TASK
    TASK -->|stdout/stderr| CW
    BE <-->|Queries| MONGO
    BE <-->|Upload/Fetch| CLOUD
```

---

### CI/CD Pipeline

```mermaid
flowchart TB
    DEV(["👨‍💻 Developer\ngit push"])

    DEV -->|"backend/** changed"| BK_CI
    DEV -->|"frontend/** changed"| FE_CI

    subgraph BK ["⚙️ backend.yml"]
        direction TB
        BK_CI["Lint &\nInstall"]
        BK_BUILD["Docker Build\n(4-stage)"]
        BK_SCAN["🛡️ Trivy\nScan"]
        BK_ECR["Push to ECR"]
        BK_ECS["Deploy Backend\nECS Service"]

        BK_CI --> BK_BUILD --> BK_SCAN
        BK_SCAN -->|push only| BK_ECR --> BK_ECS
    end

    subgraph FE ["🌐 frontend.yml"]
        direction TB
        FE_CI["Lint &\nVite Build"]
        FE_BUILD["Docker Build\n(3-stage)"]
        FE_SCAN["🛡️ Trivy\nScan"]
        FE_ECR["Push to ECR"]
        FE_ECS["Deploy Frontend\nECS Service"]

        FE_CI --> FE_BUILD --> FE_SCAN
        FE_SCAN -->|push only| FE_ECR --> FE_ECS
    end

    BK_ECS --> DONE(["✅ Live"])
    FE_ECS --> DONE

    style BK fill:#fef3c7,stroke:#f59e0b
    style FE fill:#dbeafe,stroke:#3b82f6
```

> Both pipelines are **fully independent and run in parallel** when a full-stack push touches both `backend/` and `frontend/`.
> `main` → **production** · `develop` → **staging** · Pull Requests → CI only

---

### Monitoring Stack

```mermaid
flowchart LR
    subgraph ECS ["ECS Cluster"]
        APP["Backend\nService\n/metrics"]
        PROM["Prometheus\nService\n:9090"]
        GRAF["Grafana\nService\n:3000"]
    end

    subgraph Dashboards
        D1["📊 Request Rate\n& Latency"]
        D2["🔌 Active Socket\nConnections"]
        D3["💾 Memory &\nCPU Usage"]
        D4["🚨 Alerts &\nThresholds"]
    end

    APP -->|Scrape every 15s| PROM
    PROM -->|Data source| GRAF
    GRAF --> D1 & D2 & D3 & D4
```

---

## 🛠️ Tech Stack

### Application Layer

| | Technology | Version | Purpose |
|:---:|---|:---:|---|
| ![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black) | React | 18 | Frontend SPA |
| ![Vite](https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Vite | 5 | Build tool & dev server |
| ![TailwindCSS](https://img.shields.io/badge/-Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | TailwindCSS | 3 | Utility-first styling |
| ![Zustand](https://img.shields.io/badge/-Zustand-FF6B35?style=flat-square) | Zustand | 4 | Lightweight global state |
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white) | Node.js | 18 | Backend runtime |
| ![Express](https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express&logoColor=white) | Express | 4 | REST API framework |
| ![Socket.io](https://img.shields.io/badge/-Socket.io-010101?style=flat-square&logo=socket.io) | Socket.io | 4 | WebSocket real-time layer |
| ![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) | MongoDB | Atlas | Document database |
| ![JWT](https://img.shields.io/badge/-JWT-000000?style=flat-square&logo=jsonwebtokens) | JWT + bcrypt | — | Authentication & password hashing |

### DevOps Layer

| | Technology | Purpose |
|:---:|---|---|
| ![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white) | Docker | Multi-stage container builds |
| ![Terraform](https://img.shields.io/badge/-Terraform-7B42BC?style=flat-square&logo=terraform&logoColor=white) | Terraform | AWS infrastructure as code |
| ![GitHub Actions](https://img.shields.io/badge/-GitHub%20Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white) | GitHub Actions | CI/CD automation |
| ![AWS ECR](https://img.shields.io/badge/-AWS%20ECR-FF9900?style=flat-square&logo=amazon-aws&logoColor=white) | AWS ECR | Private Docker image registry |
| ![AWS ECS](https://img.shields.io/badge/-AWS%20ECS%20EC2-FF9900?style=flat-square&logo=amazonecs&logoColor=white) | AWS ECS (EC2) | Container orchestration |
| ![AWS ALB](https://img.shields.io/badge/-AWS%20ALB-FF9900?style=flat-square&logo=amazon-aws&logoColor=white) | AWS ALB | Layer 7 load balancer |
| ![AWS VPC](https://img.shields.io/badge/-AWS%20VPC-FF9900?style=flat-square&logo=amazon-aws&logoColor=white) | AWS VPC | Network isolation |
| ![Prometheus](https://img.shields.io/badge/-Prometheus-E6522C?style=flat-square&logo=prometheus&logoColor=white) | Prometheus | Metrics collection & alerting |
| ![Grafana](https://img.shields.io/badge/-Grafana-F46800?style=flat-square&logo=grafana&logoColor=white) | Grafana | Metrics dashboards & visualization |
| ![Nginx](https://img.shields.io/badge/-Nginx-009639?style=flat-square&logo=nginx&logoColor=white) | Nginx | Frontend static file server (in Docker) |

---

## ☁️ Infrastructure (Terraform)

All AWS resources are defined as code — zero manual console configuration.

```
infrastructure/
└── terraform/
    ├── modules/
    │   ├── networking/       # VPC · subnets · IGW · NAT Gateway · route tables
    │   ├── ecr/              # ECR repositories (backend + frontend)
    │   ├── ecs/              # Cluster · task definitions · services · auto-scaling
    │   ├── alb/              # ALB · target groups · listener rules (path-based routing)
    │   ├── iam/              # Task execution role · EC2 instance profile · OIDC role
    │   ├── monitoring/       # Prometheus + Grafana ECS services · EBS volumes
    │   └── security-groups/  # ALB SG · ECS instance SG · inbound/outbound rules
    ├── environments/
    │   ├── staging/          # Smaller instance types, single AZ
    │   └── production/       # Multi-AZ, auto-scaling, larger instances
    └── backend.tf            # S3 remote state + DynamoDB state locking
```

### Key Design Decisions

| Decision | Why |
|---|---|
| **ECS EC2 launch type** | Instance-level control, cost efficiency at sustained load, SSH access for debugging |
| **Private subnets for ECS** | Containers unreachable from internet; only ALB sits in public subnets |
| **NAT Gateway** | Allows private containers to reach ECR, MongoDB Atlas, and Cloudinary outbound |
| **S3 remote state + DynamoDB lock** | Safe concurrent Terraform runs across team members |
| **ALB path-based routing** | `/api/*` and `/socket.io/*` → backend · `/*` → frontend |
| **Prometheus + Grafana on ECS** | Self-hosted monitoring co-located with app, no extra managed service cost |

### Apply Infrastructure

```bash
cd infrastructure/terraform/environments/production

terraform init        # Connect to S3 backend
terraform plan        # Preview changes
terraform apply       # Provision AWS resources
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

### Two independent pipelines

| Workflow | File | Triggers when |
|---|---|---|
| **Backend CI/CD** | `.github/workflows/backend.yml` | `backend/**` or `backend.yml` changes |
| **Frontend CI/CD** | `.github/workflows/frontend.yml` | `frontend/**` or `frontend.yml` changes |

Push a CSS fix → only the frontend pipeline runs.
Push a bug fix to an API route → only the backend pipeline runs.
Push a full-stack feature → both pipelines run **in parallel**.

Each pipeline follows the same two-job structure:

```
ci:      lint → vite build (frontend only) → docker build → trivy scan
deploy:  ecr push → task definition update → ecs rolling deploy
```

> Pull requests trigger the `ci` job only — no deploy, no AWS access.

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `AWS_ACCOUNT_ID` | AWS account ID |
| `AWS_REGION` | e.g. `ap-south-1` |
| `ECR_BACKEND_REPO` | ECR repository URI for backend |
| `ECR_FRONTEND_REPO` | ECR repository URI for frontend |
| `ECS_CLUSTER_NAME` | ECS cluster name from Terraform output |
| `ECS_SERVICE_BACKEND` | Backend ECS service name |
| `ECS_SERVICE_FRONTEND` | Frontend ECS service name |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `ACCESS_TOKEN_SECRET` | JWT secret (min 64-byte random hex) |
| `REFRESH_TOKEN_SECRET` | JWT refresh secret (min 64-byte random hex) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

> **No long-lived AWS keys stored.** GitHub Actions authenticates to AWS via **OIDC** — it assumes an IAM role with a short-lived token per workflow run.

---

## 📊 Monitoring (Prometheus + Grafana)

Both Prometheus and Grafana run as ECS services within the same cluster.

**Prometheus** scrapes the `/metrics` endpoint exposed by the backend every 15 seconds, collecting:
- HTTP request rate and latency (by route and status code)
- Active WebSocket connections
- Node.js heap memory and GC statistics
- Event loop lag

**Grafana** connects to Prometheus as a data source and provides dashboards for:

| Dashboard | Panels |
|---|---|
| **Application Overview** | Req/s · Error rate · P95 latency · Active users |
| **Socket.io** | Active connections · Messages/s · Rooms |
| **Infrastructure** | CPU % · Memory % · Network I/O |
| **Alerts** | Response time > 500ms · Error rate > 1% |

Access Grafana via the ALB at `/grafana` (internal, auth-protected).

---

## 📁 Project Structure

```
ChatHub-MERN-DevOps/
│
├── 📄 README.md
│
├── 🖥️  backend/
│   ├── Dockerfile                    # Multi-stage Node.js build
│   ├── server.js                     # HTTP + Socket.io server entry
│   └── src/
│       ├── config/                   # DB, Cloudinary, socket constants
│       ├── controllers/              # auth · users · messages · groups · linkPreview
│       ├── middleware/               # auth · error · validate · upload · rateLimit
│       ├── models/                   # User · Message · Conversation · Group · PinnedMessage · RefreshToken
│       ├── routes/                   # Express route definitions
│       ├── socket/                   # Socket.io server + message/user/group handlers
│       └── utils/                   # JWT · ApiError · ApiResponse · linkPreview
│
├── 🌐 frontend/
│   ├── Dockerfile                    # Multi-stage Vite build → Nginx
│   ├── nginx.conf                    # SPA routing + API proxy
│   └── src/
│       ├── components/               # 35 components (chat · auth · group · profile · layout · common)
│       ├── hooks/                    # useSocket · useTyping · useInfiniteMessages
│       ├── pages/                    # Chat · Groups · Profile · Settings · Login · Register
│       ├── services/                 # Axios API layer (auth · users · messages · groups)
│       ├── store/                    # Zustand (authStore · chatStore · uiStore)
│       └── utils/                   # formatDate · fileUtils · validators
│
├── ☁️  infrastructure/
│   └── terraform/
│       ├── modules/                  # networking · ecr · ecs · alb · iam · monitoring · security-groups
│       └── environments/
│           ├── staging/
│           └── production/
│
└── ⚙️  .github/
    └── workflows/
        ├── backend.yml               # Backend CI/CD — triggers on backend/** changes only
        └── frontend.yml              # Frontend CI/CD — triggers on frontend/** changes only
```

---

## 🚀 Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local) or [MongoDB Atlas](https://cloud.mongodb.com) free tier
- [Cloudinary](https://cloudinary.com) free account *(for avatar and file uploads)*

> **What is Cloudinary?** It's a cloud media storage and CDN service. The app uses it to store user avatars and shared files (images, videos, documents) so they're accessible via fast CDN URLs. The free tier is sufficient for development.

### Quick Start

```bash
# Clone the repo
git clone https://github.com/zainjafri4/ChatHub-MERN-DevOps.git
cd ChatHub-MERN-DevOps

# ── Backend ───────────────────────────────────────────────
cd backend
npm install
cp .env.example .env          # Fill in your credentials (see below)
npm run dev                   # → http://localhost:5000

# ── Frontend (new terminal) ───────────────────────────────
cd frontend
npm install
cp .env.example .env          # backend URLs for local dev (already filled)
npm run dev                   # → http://localhost:5173
```

> The Vite dev server also proxies `/api` and `/socket.io` to `localhost:5000` as a fallback, but the explicit env vars in `.env` take priority.

---

## 🔑 Environment Variables

### Frontend — `frontend/.env`

Copy `frontend/.env.example` to `frontend/.env`:

```env
# Backend REST API base URL (with /api suffix)
VITE_API_URL=http://localhost:5000/api

# Socket.io server URL (no /api suffix)
VITE_SOCKET_URL=http://localhost:5000
```

> **Why `VITE_` prefix?** Vite only exposes variables prefixed with `VITE_` to the browser bundle. Anything else stays server-side only.

> **Production values** are passed as Docker build args in the GitHub Actions workflow — they get baked into the compiled bundle:
> ```
> VITE_API_URL=https://api.yourdomain.com/api
> VITE_SOCKET_URL=https://api.yourdomain.com
> ```

---

### Backend — `backend/.env`

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
# ── Server ────────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── Database ──────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/chathub

# ── JWT ───────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
ACCESS_TOKEN_SECRET=<64-byte-random-hex>
REFRESH_TOKEN_SECRET=<64-byte-random-hex>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# ── Media Storage (Cloudinary) ────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── CORS ──────────────────────────────────────────────────
CLIENT_URL=http://localhost:5173

# ── Security ──────────────────────────────────────────────
BCRYPT_ROUNDS=12
```

---

## 🐳 Docker

Both services use **multi-stage builds** to produce minimal, secure production images.

### Backend — 4 stages

| Stage | Base | Purpose |
|:---:|---|---|
| `base` | `node:18-alpine` | Copy manifests, set workdir (shared cache layer) |
| `dependencies` | `base` | `npm ci` — all deps including devDependencies |
| `prod-deps` | `base` | `npm ci --omit=dev` — production deps only |
| `runner` | `node:18-alpine` | Copies `prod-deps` + source · non-root user · ~180MB |

### Frontend — 3 stages

| Stage | Base | Purpose |
|:---:|---|---|
| `deps` | `node:18-alpine` | `npm ci` — install all dependencies |
| `builder` | `node:18-alpine` | `npm run build` — Vite compiles to `/dist` |
| `runner` | `nginx:1.25-alpine` | Copies `/dist` only · no Node.js · non-root · ~25MB |

> The final frontend image ships **zero Node.js, zero source code, zero node_modules** — only the compiled static bundle served by Nginx.

### Build & run locally

```bash
# Build
docker build -t chathub-backend  ./backend
docker build -t chathub-frontend ./frontend

# Run backend (inject env at runtime — never bake secrets into image)
docker run -p 5000:5000 --env-file backend/.env chathub-backend

# Run frontend
docker run -p 80:80 chathub-frontend
```

---

## 🔐 Security

| Area | Implementation |
|---|---|
| **Token storage** | `httpOnly` + `Secure` + `SameSite=Strict` cookies — not accessible to JavaScript |
| **Token rotation** | Refresh tokens are single-use; new token issued on every refresh |
| **Password hashing** | bcrypt, 12 salt rounds (~300ms intentional slowness against brute force) |
| **Rate limiting** | Auth 10/15min · Messages 30/min · Uploads 10/min |
| **HTTP security headers** | Helmet.js — CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| **Input validation** | `express-validator` on all endpoints + Mongoose schema validation |
| **Network isolation** | ECS containers in private subnets; ALB is the only internet-facing resource |
| **IAM least privilege** | Task execution role scoped to ECR pull + log delivery only |
| **No stored AWS keys** | GitHub Actions uses OIDC to assume IAM role per workflow run |

---

<div align="center">

Made with ❤️ by **[Zain Raza Jafri](https://github.com/zainjafri4)**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/zainjafri4/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/zainjafri4)

</div>
