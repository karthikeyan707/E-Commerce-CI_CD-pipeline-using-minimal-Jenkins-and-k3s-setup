# Complete Deployment Guide - E-Commerce CI/CD with k3s

This guide provides step-by-step instructions to deploy the complete E-Commerce CI/CD pipeline with Jenkins master/slave, SonarQube, Nexus, Trivy, and k3s cluster with persistent PostgreSQL.

## Prerequisites

- AWS Account with EC2 access
- SSH client
- DockerHub account
- GitHub account (for Jenkins webhooks)

---

## Phase 1: AWS EC2 Instance Setup

### Step 1.1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. **Instance Details**:
   - Name: `ecommerce-cicd-k3s`
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: `t3.small` (1 vCPU, 2GB RAM)
   - Key Pair: Select or create your key pair

3. **Network Settings**:
   - VPC: Default
   - Subnet: Default
   - Auto-assign Public IP: Enable
   - Security Group: Create new with rules:
     - SSH (22): Your IP
     - HTTP (80): 0.0.0.0/0
     - Custom TCP (8080): 0.0.0.0/0 (Jenkins)
     - Custom TCP (9000): 0.0.0.0/0 (SonarQube)
     - Custom TCP (8081): 0.0.0.0/0 (Nexus)

4. **Storage**: 20GB GP3

5. **Advanced Details** → User Data:
```bash
#!/bin/bash
# Update system
apt-get update -y

# Install Git
apt-get install -y git

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

6. Launch Instance

### Step 1.2: Connect to EC2 Instance

```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

---

## Phase 2: Verify Initial Setup

### Step 2.1: Verify Docker Installation

```bash
docker --version
docker ps
```

### Step 2.2: Verify k3s Installation

```bash
kubectl version --client
kubectl get nodes
```

### Step 2.3: Verify Jenkins Containers

```bash
docker ps | grep jenkins
```

Expected output:
- `jenkins-master` container running
- `jenkins-agent` container running

### Step 2.4: Get Jenkins Initial Password

```bash
docker exec jenkins-master cat /var/jenkins_home/secrets/initialAdminPassword
```

Note this password for Jenkins setup.

---

## Phase 3: Jenkins Initial Setup

### Step 3.1: Access Jenkins UI

1. Open browser: `http://<EC2-PUBLIC-IP>:8080`
2. Enter initial admin password from Step 2.4
3. Click "Install suggested plugins"
4. Wait for plugin installation
5. Create first admin user:
   - Username: `admin`
   - Password: `<your-secure-password>`
   - Full name: `Jenkins Admin`
   - Email: `admin@example.com`
6. Save and continue
7. Configure Jenkins URL: `http://<EC2-PUBLIC-IP>:8080`
8. Save and finish

### Step 3.2: Install Additional Plugins

1. Go to "Manage Jenkins" → "Plugins" → "Available plugins"
2. Install these plugins:
   - Docker Pipeline
   - Kubernetes CLI
   - SonarQube Scanner
   - GitHub Integration
3. Restart Jenkins after installation

---

## Phase 4: Configure Jenkins Credentials

### Step 4.1: Add DockerHub Credentials

1. Go to "Manage Jenkins" → "Credentials" → "System" → "Global credentials"
2. Click "Add Credentials"
3. Type: "Username with password"
4. Username: Your DockerHub username
5. Password: Your DockerHub password/token
6. ID: `dockerhub-credentials`
7. Click "Create"

### Step 4.2: Add SonarQube Token (After SonarQube Setup)

1. Go to SonarQube UI: `http://<EC2-PUBLIC-IP>:9000`
2. Login with default credentials: `admin/admin`
3. Change password when prompted
4. Go to "My Account" → "Security" → "Generate Token"
5. Token name: `jenkins`
6. Copy the token
7. In Jenkins: Add Credentials → "Secret text"
8. Secret: Paste SonarQube token
9. ID: `sonarqube-token`
10. Click "Create"

### Step 4.3: Add Nexus Credentials (After Nexus Setup)

1. Go to Nexus UI: `http://<EC2-PUBLIC-IP>:8081`
2. Login with default credentials: `admin/admin123`
3. Change password when prompted
4. In Jenkins: Add Credentials → "Username with password"
5. Username: `admin`
6. Password: Your Nexus password
7. ID: `nexus-credentials`
8. Click "Create"

---

## Phase 5: Setup DevOps Tools

### Step 5.1: Setup SonarQube

```bash
cd /home/ubuntu/E-Commerce-CI_CD-pipeline-using-minimal-Jenkins-and-k3s-setup
chmod +x scripts/setup-sonarqube.sh
./scripts/setup-sonarqube.sh
```

Wait for SonarQube to start (2-3 minutes), then access at `http://<EC2-PUBLIC-IP>:9000`

### Step 5.2: Setup Nexus

```bash
chmod +x scripts/setup-nexus.sh
./scripts/setup-nexus.sh
```

Wait for Nexus to start (3-5 minutes), then access at `http://<EC2-PUBLIC-IP>:8081`

### Step 5.3: Setup Trivy

```bash
chmod +x scripts/setup-trivy.sh
./scripts/setup-trivy.sh
```

Verify Trivy installation:
```bash
trivy --version
```

---

## Phase 6: Configure Jenkins Agent

### Step 6.1: Verify Agent Connection

1. In Jenkins UI, go to "Manage Jenkins" → "Nodes"
2. You should see `jenkins-slave` listed
3. Click on `jenkins-slave` to verify it's connected
4. Status should show "Online"

If agent is not online:
```bash
docker logs jenkins-agent
docker restart jenkins-agent
```

---

## Phase 7: Create Jenkins CI Pipeline

### Step 7.1: Create CI Pipeline Job

1. In Jenkins UI, click "New Item"
2. Name: `ecommerce-ci`
3. Type: "Pipeline"
4. Click "OK"

### Step 7.2: Configure CI Pipeline

1. Under "Pipeline" section:
   - Definition: "Pipeline script from SCM"
   - SCM: "Git"
   - Repository URL: `https://github.com/karthikeyan707/E-Commerce-CI_CD-pipeline-using-minimal-Jenkins-and-k3s-setup.git`
   - Branch: `*/main`
   - Script Path: `jenkins/Jenkinsfile-CI`

2. Update DockerHub username in Jenkinsfile-CI:
   ```bash
   nano jenkins/Jenkinsfile-CI
   # Change line 15: DOCKERHUB_USERNAME = 'your-dockerhub-username'
   # To: DOCKERHUB_USERNAME = 'your-actual-dockerhub-username'
   ```

3. Click "Save"

### Step 7.3: Test CI Pipeline

1. Click "Build Now" on the CI pipeline
2. Monitor the build progress
3. Verify all stages complete successfully

---

## Phase 8: Create Jenkins CD Pipeline

### Step 8.1: Create CD Pipeline Job

1. In Jenkins UI, click "New Item"
2. Name: `ecommerce-cd`
3. Type: "Pipeline"
4. Click "OK"

### Step 8.2: Configure CD Pipeline

1. Under "Pipeline" section:
   - Definition: "Pipeline script from SCM"
   - SCM: "Git"
   - Repository URL: `https://github.com/karthikeyan707/E-Commerce-CI_CD-pipeline-using-minimal-Jenkins-and-k3s-setup.git`
   - Branch: `*/main`
   - Script Path: `jenkins/Jenkinsfile-CD`

2. Update DockerHub username in Jenkinsfile-CD:
   ```bash
   nano jenkins/Jenkinsfile-CD
   # Change line 12: DOCKERHUB_USERNAME = 'your-dockerhub-username'
   # To: DOCKERHUB_USERNAME = 'your-actual-dockerhub-username'
   ```

3. Click "Save"

---

## Phase 9: Deploy to k3s

### Step 9.1: Manual Deployment (First Time)

```bash
cd /home/ubuntu/E-Commerce-CI_CD-pipeline-using-minimal-Jenkins-and-k3s-setup
chmod +x scripts/deploy-k3s.sh
./scripts/deploy-k3s.sh
```

When prompted, enter your DockerHub username.

### Step 9.2: Verify k3s Deployment

```bash
# Check all pods
kubectl get pods -o wide

# Check services
kubectl get services

# Check StatefulSet
kubectl get statefulset

# Check persistent volumes
kubectl get pvc

# Check ingress
kubectl get ingress
```

Expected output:
- 3 PostgreSQL pods (postgres-0, postgres-1, postgres-2)
- 1 pod each for: product-service, order-service, user-service, api-gateway, frontend
- All pods should be in "Running" state

### Step 9.3: Get Node IP

```bash
kubectl get nodes -o wide
```

Note the "INTERNAL-IP" or "EXTERNAL-IP" of the node.

---

## Phase 10: Access and Test Application

### Step 10.1: Access Application

1. Frontend: `http://<NODE-IP>/`
2. API: `http://<NODE-IP>/api/`
3. Traefik Dashboard: `http://<NODE-IP>:8080/`

### Step 10.2: Test API Endpoints

```bash
# Test health endpoints
curl http://<NODE-IP>/api/products
curl http://<NODE-IP>/api/health

# Test user registration
curl -X POST http://<NODE-IP>/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Test user login
curl -X POST http://<NODE-IP>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Step 10.3: Test PostgreSQL Failover

```bash
# Check current PostgreSQL pods
kubectl get pods -l app=postgres

# Delete one pod to test failover
kubectl delete pod postgres-0

# Watch pod recovery
kubectl get pods -l app=postgres -w

# Verify data persistence
kubectl exec -it postgres-1 -- psql -U postgres -d products_db -c "SELECT * FROM products;"
```

---

## Phase 11: Setup GitHub Webhook (Optional)

### Step 11.1: Configure Jenkins for Webhooks

1. In Jenkins UI, go to "Manage Jenkins" → "Configure System"
2. Under "GitHub" section:
   - Add GitHub Server
   - API URL: `https://api.github.com`
   - Credentials: Add GitHub personal access token
3. Click "Test connection"
4. Click "Save"

### Step 11.2: Create Webhook in GitHub

1. Go to your GitHub repository
2. Settings → Webhooks → "Add webhook"
3. Payload URL: `http://<EC2-PUBLIC-IP>:8080/github-webhook/`
4. Content type: `application/json`
5. Secret: (optional)
6. Events: Select "Push" events
7. Click "Add webhook"

---

## Phase 12: Complete CI/CD Pipeline Test

### Step 12.1: Make a Code Change

```bash
cd /home/ubuntu/E-Commerce-CI_CD-pipeline-using-minimal-Jenkins-and-k3s-setup

# Make a small change to test the pipeline
echo "// Test change" >> frontend/src/App.jsx

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin main
```

### Step 12.2: Monitor CI Pipeline

1. In Jenkins UI, go to `ecommerce-ci` job
2. Watch the build trigger automatically
3. Monitor all stages:
   - Checkout
   - Build
   - Unit Tests
   - SonarQube Analysis
   - Quality Gate
   - Docker Build
   - Trivy Scan
   - Push to DockerHub
   - Upload to Nexus
   - Manual Approval

### Step 12.3: Approve Deployment

1. When CI pipeline reaches "Manual Approval for CD" stage
2. Click on the build
3. Click "Proceed" or input the required parameters
4. Select deployment environment: `production`
5. Submit approval

### Step 12.4: Monitor CD Pipeline

1. Go to `ecommerce-cd` job
2. Watch the deployment stages:
   - Checkout
   - Configure kubectl
   - Create Namespace
   - Update Image Tags
   - Apply ConfigMaps/Secrets
   - Deploy PostgreSQL
   - Deploy Backend Services
   - Wait for Services
   - Deploy Frontend
   - Apply Ingress
   - Verify Deployment
   - Smoke Tests

### Step 12.5: Verify Deployment

```bash
# Check updated pods
kubectl get pods -o wide

# Check if new images are deployed
kubectl describe deployment frontend | grep Image
kubectl describe deployment product-service | grep Image
```

---

## Phase 13: Monitoring and Maintenance

### Step 13.1: Monitor Jenkins

```bash
# Check Jenkins containers
docker ps | grep jenkins

# Check Jenkins logs
docker logs jenkins-master --tail 100
docker logs jenkins-agent --tail 100
```

### Step 13.2: Monitor k3s Cluster

```bash
# Check cluster health
kubectl get nodes
kubectl top nodes
kubectl top pods

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp

# Check pod logs
kubectl logs -f deployment/api-gateway
kubectl logs -f statefulset/postgres
```

### Step 13.3: Monitor DevOps Tools

```bash
# Check SonarQube
docker ps | grep sonarqube

# Check Nexus
docker ps | grep nexus

# Check Trivy
trivy --version
```

---

## Troubleshooting

### Jenkins Issues

**Jenkins master not accessible:**
```bash
docker logs jenkins-master
docker restart jenkins-master
```

**Jenkins agent not connecting:**
```bash
docker logs jenkins-agent
docker restart jenkins-agent
# In Jenkins UI: Manage Jenkins → Nodes → jenkins-slave → Disconnect → Reconnect
```

### k3s Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

**PostgreSQL connection issues:**
```bash
kubectl get statefulset postgres
kubectl get pods -l app=postgres
kubectl exec -it postgres-0 -- pg_isready -U postgres
kubectl get pvc
```

**Ingress not working:**
```bash
kubectl get ingress
kubectl describe ingress
# Check Traefik: http://<NODE-IP>:8080
```

### Docker Issues

**Docker build fails:**
```bash
docker ps
df -h  # Check disk space
docker system prune -a  # Clean up if needed
```

---

## Security Recommendations

1. **Change all default passwords** (Jenkins, SonarQube, Nexus)
2. **Use strong passwords** for all services
3. **Restrict security group rules** to specific IPs where possible
4. **Enable HTTPS** for production (configure SSL certificates)
5. **Regular updates**: Keep k3s, Docker, and dependencies updated
6. **Backup Jenkins configuration**: `/var/jenkins_home` volume
7. **Backup PostgreSQL data**: Persistent volumes are already configured

---

## Cost Optimization

Current setup on AWS t3.small:
- **EC2 Instance**: ~$10-15/month (Free Tier eligible)
- **Data Transfer**: Minimal for demo
- **Storage**: 20GB GP3 ~$2.40/month

**To reduce costs further**:
- Stop EC2 instance when not in use
- Use smaller instance types for testing
- Clean up unused Docker images regularly

---

## Summary

You now have a complete CI/CD pipeline with:
- ✅ Jenkins master/slave automation
- ✅ SonarQube for code quality
- ✅ Nexus for artifact storage
- ✅ Trivy for security scanning
- ✅ k3s cluster with persistent PostgreSQL (3 replicas)
- ✅ Multi-AZ simulation with pod anti-affinity
- ✅ Automated CI/CD pipeline
- ✅ E-Commerce microservices deployment

The pipeline will automatically:
1. Build your application
2. Run tests
3. Scan code quality with SonarQube
4. Scan container security with Trivy
5. Push images to DockerHub
6. Store artifacts in Nexus
7. Deploy to k3s with persistent database
