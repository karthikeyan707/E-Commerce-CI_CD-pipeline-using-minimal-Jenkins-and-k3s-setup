# E-Commerce CI/CD Project

A microservices-based E-Commerce system with complete CI/CD pipeline on k3s (lightweight Kubernetes). Features a React frontend, JWT authentication, and 5 products with shopping cart functionality. Optimized for AWS Free Tier t3.small instances with Jenkins master/slave, SonarQube, Nexus, and Trivy.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Jenkins Master/Slave (CI/CD)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │  SonarQube   │  │    Nexus     │  │    Trivy     │  │ Docker  ││
│  │  (Code Qaul) │  │  (Artifacts) │  │  (Security)  │  │ (Build) ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────┐
│                           React Frontend (Port 80)                   │
│                    SPA - Products, Cart, Orders, Auth                │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────┐
│                              k3s Cluster                            │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                     Traefik Ingress                          │   │
│  └───────────────────────┬───────────────────────────────────┘   │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────────────┐     │
│  │                API Gateway (1 replica)                  │     │
│  │             Port: 3000, Rate Limiting                  │     │
│  └───────────────┬───────────────────────┬──────────────────┘     │
│                  │                       │                          │
│      ┌───────────▼──────────┐  ┌────────▼──────────┐  ┌───────────┐│
│      │   Product Service    │  │  Order Service  │  │User Service│
│      │   (1 replica)       │  │  (1 replica)   │  │(1 replica)│
│      │   Port: 3001         │  │  Port: 3002     │  │Port: 3003  │
│      └───────────┬──────────┘  └────────┬──────────┘  └─────┬─────┘│
│                  │                     │                   │      │
│      ┌───────────▼─────────────────────▼───────────────────▼────┐│
│      │      PostgreSQL StatefulSet (1 replica, Persistent)       ││
│      │      Databases: products_db, orders_db, users_db          ││
│      └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description | Database |
|---------|------|-------------|----------|
| Frontend | 80 | React SPA (Products, Cart, Orders) | None |
| API Gateway | 3000 | Reverse proxy, rate limiting, routing | None |
| Product Service | 3001 | Product CRUD, 5 seeded products | PostgreSQL |
| Order Service | 3002 | Order management, user order history | PostgreSQL |
| User Service | 3003 | JWT authentication (register/login) | PostgreSQL |

## API Endpoints

### Authentication (via API Gateway)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user (username, password) |
| `/api/auth/login` | POST | Login and get JWT token |
| `/api/users/profile` | GET | Get user profile (JWT required) |

### Products
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List all 5 products |
| `/api/products/:id` | GET | Get single product |

### Orders (JWT Required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | POST | Create order with cart items |
| `/api/orders/user/:userId` | GET | Get user's order history |

## Project Structure

```
E_Commerce-CICD/
├── frontend/             # React SPA (Products, Cart, Auth, Orders)
│   ├── src/
│   │   ├── pages/        # Home, Cart, Login, Register, Orders
│   │   ├── components/   # Navbar
│   │   └── context/      # AuthContext, CartContext
│   └── public/
├── api-gateway/          # API Gateway microservice
├── product-service/      # Product Service with 5 seeded products
├── order-service/        # Order Service (linked to users)
├── user-service/         # JWT Authentication service
├── k8s/                  # Kubernetes manifests
│   └── k3s-demo-ultra/   # Ultra-optimized k3s manifests (t3.small)
│       ├── deployment-*.yaml      # Optimized deployments (1 replica)
│       ├── configmap-*.yaml       # Service configurations
│       ├── secret-*.yaml          # Database credentials
│       ├── ingress.yaml          # Traefik ingress
│       └── kustomization.yaml    # Kustomize config
├── jenkins/
│   ├── Jenkinsfile-CI   # CI pipeline (build, test, SonarQube, Trivy, Nexus)
│   └── Jenkinsfile-CD   # CD pipeline (k3s deployment)
├── docker/
│   ├── docker-compose.yml       # Full local stack with frontend
│   └── docker-compose.build.yml # Build all images
└── scripts/
    ├── setup-jenkins-master-slave.sh  # Jenkins master/slave setup
    ├── setup-sonarqube.sh              # SonarQube setup
    ├── setup-nexus.sh                  # Nexus setup
    ├── setup-trivy.sh                  # Trivy setup
    ├── setup-rds.sh                    # RDS Multi-AZ setup (optional)
    ├── build-images.sh                 # Build Docker images
    ├── push-images.sh                  # Push to DockerHub
    └── deploy-k3s.sh                   # Deploy to k3s
```

## Prerequisites

### For k3s Deployment (t3.small)
- AWS EC2 t3.small instance (1 vCPU, 2GB RAM) or equivalent
- kubectl v1.28+
- Docker v24+
- Node.js 20+
- curl
- DockerHub account

### For Local Development
- Docker v24+
- Node.js 20+
- npm

## Quick Start

### 1. Infrastructure Setup (k3s on t3.small)

**Resource Requirements:** AWS EC2 t3.small instance (1 vCPU, 2GB RAM)

#### 1.1 Launch EC2 Instance with User Data

Use the following User Data script when launching your EC2 instance:

```bash
#!/bin/bash
# Update system
apt-get update -y

# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# Install k3s
curl -sfL https://get.k3s.io | sh -

# Wait for k3s to start
sleep 30

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
mv kubectl /usr/local/bin/

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Clone repository
cd /home/ubuntu
git clone https://github.com/karthikeyan707/E-Commerce-CI_CD-pipeline-using-minimal-Jenkins-and-k3s-setup.git
cd E-Commerce-CI_CD-pipeline-using-minimal-Jenkins-and-k3s-setup

# Setup Jenkins master/slave
chmod +x scripts/setup-jenkins-master-slave.sh
./scripts/setup-jenkins-master-slave.sh
```

#### 1.2 Access Jenkins

```bash
# Get EC2 public IP
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Access Jenkins at: http://$INSTANCE_IP:8080

# Get initial admin password
docker exec jenkins-master cat /var/jenkins_home/secrets/initialAdminPassword
```

#### 1.3 Configure Jenkins

1. Complete Jenkins initial setup wizard
2. Install required plugins:
   - Pipeline
   - Git
   - Docker Pipeline
   - Kubernetes CLI
   - SonarQube Scanner

3. Configure credentials:
   - `dockerhub-credentials` - DockerHub username/password
   - `sonarqube-token` - SonarQube authentication token
   - `nexus-credentials` - Nexus username/password

4. **Configure Jenkins agent manually** - The setup script creates only the Jenkins master
   - In Jenkins UI: Manage Jenkins → Manage Nodes → New Node
   - Name: `jenkins-slave`
   - Launch method: Launch agents via SSH
   - Configure SSH credentials for the host machine

5. Create CI Pipeline:
   - New Item → Pipeline
   - Name: `ecommerce-ci`
   - Pipeline script from SCM
   - Repository URL: your GitHub repo
   - Script Path: `jenkins/Jenkinsfile-CI`

6. Create CD Pipeline:
   - New Item → Pipeline
   - Name: `ecommerce-cd`
   - Pipeline script from SCM
   - Script Path: `jenkins/Jenkinsfile-CD`

#### 1.4 Setup DevOps Tools (Optional)

```bash
# SonarQube
chmod +x scripts/setup-sonarqube.sh
./scripts/setup-sonarqube.sh

# Nexus
chmod +x scripts/setup-nexus.sh
./scripts/setup-nexus.sh

# Trivy
chmod +x scripts/setup-trivy.sh
./scripts/setup-trivy.sh
```

#### 1.5 Deploy to k3s

**Option 1: Using Jenkins Pipeline (Recommended)**
1. Update `DOCKERHUB_USERNAME` in `jenkins/Jenkinsfile-CI`
2. Trigger Jenkins CI pipeline
3. Approve deployment in Jenkins
4. CD pipeline will deploy to k3s automatically

**Option 2: Manual Deployment**
```bash
# Update image tags in manifests
cd k8s/k3s-demo-ultra
sed -i 's|your-dockerhub-username|your-dockerhub-username|g' *.yaml
cd ../..

# Deploy all manifests
kubectl apply -k k8s/k3s-demo-ultra

# Wait for all resources to be ready
kubectl rollout status statefulset/postgres --timeout=120s
kubectl rollout status deployment/product-service --timeout=60s
kubectl rollout status deployment/order-service --timeout=60s
kubectl rollout status deployment/user-service --timeout=60s
kubectl rollout status deployment/api-gateway --timeout=60s
kubectl rollout status deployment/frontend --timeout=60s
```

#### 1.6 Access the Application
```bash
# Get the node IP
kubectl get nodes -o wide

# Access via:
# Frontend: http://<NODE-IP>/
# API: http://<NODE-IP>/api/
# Traefik Dashboard: http://<NODE-IP>:8080/
```

**Resource Usage (k3s on t3.small):**
- Total RAM: ~800MB (vs 2GB available)
- Total CPU: ~0.5 cores (vs 1 core available)
- Cost: ~$10-15/month (AWS Free Tier)
- **Note**: PostgreSQL uses persistent storage with 5Gi per replica

### 2. Local Development

#### 2.1 Install Dependencies
```bash
cd api-gateway && npm install
cd ../product-service && npm install
cd ../order-service && npm install
cd ../user-service && npm install
cd ../frontend && npm install
```

#### 2.2 Environment Configuration
```bash
cp api-gateway/.env.example api-gateway/.env
cp product-service/.env.example product-service/.env
cp order-service/.env.example order-service/.env
cp user-service/.env.example user-service/.env
cp frontend/.env.example frontend/.env
```

Edit the `.env` files with your database credentials and service URLs.

#### 2.3 Start Full Stack with Docker Compose (Recommended)
```bash
cd docker

# (Optional) Override default secrets for production use:
# Create a .env file in the docker/ directory:
#   echo "JWT_SECRET=your-strong-secret-here" > .env

docker-compose up -d

# Access:
# Frontend: http://localhost (port 80)
# API: http://localhost:3000
```

#### 2.4 Start Services Locally (Individual)
```bash
# Terminal 1 - PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15-alpine

# Terminal 2 - Product Service
cd product-service && npm run dev

# Terminal 3 - Order Service  
cd order-service && npm run dev

# Terminal 4 - User Service
cd user-service && npm run dev

# Terminal 5 - API Gateway
cd api-gateway && npm run dev

# Terminal 6 - Frontend (Vite dev server)
cd frontend && npm run dev
```

#### 2.4 Test Endpoints
```bash
# Health Checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# API Gateway
curl http://localhost:3000/api/products
curl http://localhost:3000/api/orders

# Authentication
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### 3. Docker Build with Docker Compose

**Note for Vite users:** The frontend's `VITE_API_URL` is a build-time environment variable. When using the Docker build, pass it via `--build-arg` (already configured in `docker-compose.build.yml`). The nginx config handles runtime API routing via reverse proxy, so the frontend container deployed to k8s does not need this variable at runtime (the nginx `try_files` directive serves the SPA and proxies `/api` calls).

#### 3.1 Build All Images at Once
```bash
# Option 1: Using docker-compose build file
cd docker
docker-compose -f docker-compose.build.yml build

# Option 2: Using helper script (builds + tags with version)
chmod +x scripts/build-images.sh
./scripts/build-images.sh your-dockerhub-username 1.0.0

# Option 3: Build with custom tags
IMAGE_TAG=1.0.0 DOCKERHUB_USERNAME=myuser docker-compose -f docker-compose.build.yml build
```

#### 3.2 Run Full Local Stack (with PostgreSQL)
```bash
cd docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

#### 3.3 Push to DockerHub
```bash
chmod +x scripts/push-images.sh
./scripts/push-images.sh your-dockerhub-username 1.0.0
```

### 4. Kubernetes Deployment

#### 4.1 Configure kubectl
```bash
# k3s ships with kubectl already configured
kubectl version --client
kubectl get nodes
```

#### 4.2 Create Namespace
```bash
kubectl create namespace production
kubectl create namespace staging
```

#### 4.3 Deploy All Manifests (via Kustomize)
```bash
cd k8s/k3s-demo-ultra

# Deploy everything (StorageClass, ConfigMaps, Secrets, StatefulSet, Deployments, Ingress)
kubectl apply -k .

# Wait for all resources to be ready
kubectl rollout status statefulset/postgres --timeout=300s
kubectl rollout status deployment/product-service --timeout=120s
kubectl rollout status deployment/order-service --timeout=120s
kubectl rollout status deployment/user-service --timeout=120s
kubectl rollout status deployment/api-gateway --timeout=120s
kubectl rollout status deployment/frontend --timeout=120s
```

#### 4.4 Manual Deployment (without Kustomize)
```bash
cd k8s/k3s-demo-ultra

# StorageClass
kubectl apply -f storageclass.yaml

# ConfigMaps
kubectl apply -f configmap-postgres.yaml
kubectl apply -f configmap-api-gateway.yaml
kubectl apply -f configmap-product-service.yaml
kubectl apply -f configmap-order-service.yaml
kubectl apply -f configmap-user-service.yaml

# Secrets
kubectl apply -f secret-postgres.yaml
kubectl apply -f secret-db.yaml
kubectl apply -f secret-user-service.yaml

# PostgreSQL StatefulSet (includes headless service)
kubectl apply -f statefulset-postgres.yaml

# Verify PostgreSQL is running
kubectl rollout status statefulset/postgres --timeout=300s

# Backend Deployments (each includes ClusterIP service inline)
kubectl apply -f deployment-product-service.yaml
kubectl apply -f deployment-order-service.yaml
kubectl apply -f deployment-user-service.yaml
kubectl apply -f deployment-api-gateway.yaml

# Frontend (includes ClusterIP service inline)
kubectl apply -f deployment-frontend.yaml

# Ingress
kubectl apply -f ingress.yaml
```

#### 4.5 Access the Application
```bash
# Get node IP
kubectl get nodes -o wide

# Frontend: http://<NODE-IP>/
# API: http://<NODE-IP>/api/
# Traefik Dashboard: http://<NODE-IP>:8080/

# Or port-forward for local testing
kubectl port-forward svc/frontend 8080:80
# Open http://localhost:8080 in browser
```

#### 4.6 Verify Deployment
```bash
# Check pods
kubectl get pods

# Check services
kubectl get svc

# Check StatefulSet
kubectl get statefulset

# Check persistent volumes
kubectl get pvc

# View logs
kubectl logs -f deployment/api-gateway
```

**Note:** The ingress uses Traefik (k3s's default ingress controller) with a wildcard host rule. Service URLs are resolved via Kubernetes DNS (e.g. `http://product-service:3001`).

### 5. CI/CD Pipeline Setup

#### 5.1 Jenkins Configuration
1. Access Jenkins at `http://<jenkins-loadbalancer>:8080`
2. Install required plugins:
   - Pipeline
   - Git
   - Docker Pipeline
   - Kubernetes CLI
   - SonarQube Scanner
   - Slack Notification

3. Configure credentials:
   - `dockerhub-credentials` - DockerHub username/password
   - `aws-credentials` - AWS access key/secret
   - `github-token` - GitHub personal access token
   - `sonarqube-token` - SonarQube authentication token
   - `nexus-credentials` - Nexus username/password

**Note:** The CI pipeline uses `docker-compose` to build all images in parallel. See `docker/docker-compose.build.yml`.

4. Create CI Pipeline:
   - New Item → Pipeline
   - Name: `ecommerce-ci`
   - Pipeline script from SCM
   - Repository URL: your GitHub repo
   - Script Path: `jenkins/Jenkinsfile-CI`

5. Create CD Pipeline:
   - New Item → Pipeline
   - Name: `ecommerce-cd`
   - Pipeline script from SCM
   - Script Path: `jenkins/Jenkinsfile-CD`

#### 5.2 SonarQube Configuration
1. Access SonarQube at `http://<sonarqube-loadbalancer>:9000`
2. Default credentials: `admin/admin`
3. Create projects for each service:
   - `ecommerce-api-gateway`
   - `ecommerce-product-service`
   - `ecommerce-order-service`
   - `ecommerce-user-service`
   - `ecommerce-frontend`
4. Generate tokens and add to Jenkins credentials

#### 5.3 Nexus Configuration
1. Access Nexus at `http://<nexus-loadbalancer>:8081`
2. Create blob stores and repositories:
   - docker-hosted (port 8082)
   - docker-proxy (Docker Hub)
   - docker-group (combine hosted + proxy)
3. Create `ecommerce-artifacts` raw repository

## API Endpoints

### API Gateway
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/products` | List products (proxied) |
| POST | `/api/products` | Create product (proxied) |
| GET | `/api/products/:id` | Get product (proxied) |
| GET | `/api/orders` | List orders (proxied) |
| POST | `/api/orders` | Create order (proxied) |
| GET | `/api/orders/:id` | Get order (proxied) |

### Product Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/products` | List products with pagination |
| POST | `/products` | Create new product |
| GET | `/products/:id` | Get product by ID |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

### Order Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/orders` | List orders with pagination |
| POST | `/orders` | Create new order |
| GET | `/orders/:id` | Get order by ID |
| PUT | `/orders/:id/status` | Update order status |
| DELETE | `/orders/:id` | Delete order |

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  customer_email VARCHAR(255),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PENDING',
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  product_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## CI/CD Pipeline Stages

### CI Pipeline (Jenkinsfile-CI)
1. **Trigger** - GitHub webhook on push
2. **Checkout** - Clone repository
3. **Build** - Install dependencies (npm ci)
4. **Unit Tests** - Run test suites with coverage
5. **SonarQube Analysis** - Code quality scan
6. **Quality Gate** - Enforce quality standards
7. **Docker Build** - Build container images using docker-compose
8. **Trivy Scan** - Security vulnerability scan
9. **Push to DockerHub** - Publish images
10. **Upload to Nexus** - Archive artifacts
11. **Manual Approval** - Approve deployment (production/staging)
12. **Trigger CD** - Start deployment pipeline

### CD Pipeline (Jenkinsfile-CD)
1. **Checkout** - Clone repository
2. **Configure kubectl** - Verify k3s cluster connection
3. **Create Namespace** - Create deployment namespace
4. **Update Image Tags** - Update deployment manifests
5. **Apply ConfigMaps/Secrets** - Apply Kubernetes configurations
6. **Deploy PostgreSQL** - Deploy database
7. **Deploy Backend Services** - Deploy microservices
8. **Wait for Services** - Verify services are ready
9. **Deploy Frontend** - Deploy React frontend
10. **Apply Ingress** - Configure Traefik ingress
11. **Verify Deployment** - Check deployment status
12. **Smoke Tests** - Run health checks

## Production Checklist

- [ ] Update `DOCKERHUB_USERNAME` in Jenkinsfiles and manifests
- [ ] Configure proper resource limits (CPU/Memory) in k8s manifests
- [ ] Configure proper database passwords in Secrets
- [ ] Set up SonarQube projects and quality gates
- [ ] Configure Nexus repositories
- [ ] Set up Jenkins credentials (DockerHub, SonarQube, Nexus)
- [ ] Configure Jenkins agent (jenkins-slave)
- [ ] Set up GitHub webhook for Jenkins
- [ ] Configure backup for PostgreSQL data
- [ ] Set up monitoring and alerting

## Troubleshooting

### Common Issues

**Pod not starting**
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
```

**Database connection failed**
- Check PostgreSQL StatefulSet status: `kubectl get statefulset postgres`
- Check PostgreSQL pods: `kubectl get pods -l app=postgres`
- Check DB credentials in Kubernetes Secret
- Verify PostgreSQL is ready: `kubectl exec -it postgres-0 -- pg_isready -U postgres`
- Check persistent volumes: `kubectl get pvc`

**Ingress not working**
```bash
kubectl get ingress
kubectl describe ingress ecommerce-ingress
# Check Traefik dashboard: http://<NODE-IP>:8080
```

**Jenkins agent not connecting**
- Check Jenkins agent status in Jenkins UI
- Verify agent is running: `docker ps | grep jenkins-agent`
- Check agent logs: `docker logs jenkins-agent`
- Restart agent if needed: `docker restart jenkins-agent`

**Docker build fails**
- Verify Docker is running: `docker ps`
- Check disk space: `df -h`
- Verify docker-compose.build.yml has all services

## Security Best Practices

1. **Never commit secrets** - Use Kubernetes Secrets
2. **Non-root containers** - All services run as non-root user
3. **Network policies** - Restrict pod-to-pod communication
4. **Image scanning** - Trivy scans all images before deployment
5. **RBAC** - Use least-privilege Kubernetes roles
6. **Encryption** - Use TLS for ingress (configure Traefik)
7. **Security groups** - Restrict EC2 security group to necessary ports only
8. **Update regularly** - Keep k3s, Docker, and dependencies updated

## Monitoring & Logging

### k3s Built-in Monitoring
```bash
# View pod logs
kubectl logs -f deployment/api-gateway
kubectl logs -f deployment/product-service

# View resource usage
kubectl top pods
kubectl top nodes

# View events
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Prometheus & Grafana (Optional)
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and feature requests, please use GitHub Issues.
