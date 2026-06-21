#!/bin/bash

# Jenkins Master/Slave Setup Script for k3s on t3.small
# This script sets up Jenkins master and slave for CI/CD pipeline

set -e

echo "=========================================="
echo "Jenkins Master/Slave Setup for k3s"
echo "=========================================="

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker ubuntu
    echo "Docker installed successfully"
else
    echo "Docker is already installed"
fi

# Install k3s if not present
if ! command -v k3s &> /dev/null; then
    echo "Installing k3s..."
    curl -sfL https://get.k3s.io | sh -
    echo "k3s installed successfully"
else
    echo "k3s is already installed"
fi

# Wait for k3s to be ready
echo "Waiting for k3s to be ready..."
sleep 10

# Configure kubectl for jenkins user
echo "Configuring kubectl for Jenkins..."
mkdir -p /home/jenkins/.kube
cp /etc/rancher/k3s/k3s.yaml /home/jenkins/.kube/config
chown -R jenkins:jenkins /home/jenkins/.kube
chmod 600 /home/jenkins/.kube/config

# Pull Jenkins master image
echo "Pulling Jenkins master image..."
docker pull jenkins/jenkins:lts

# Create Jenkins master container
echo "Creating Jenkins master container..."
docker run -d \
  --name jenkins-master \
  --restart unless-stopped \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /home/jenkins/.kube:/home/jenkins/.kube \
  -e DOCKER_HOST=unix:///var/run/docker.sock \
  jenkins/jenkins:lts

# Wait for Jenkins to start
echo "Waiting for Jenkins to start..."
sleep 30

# Get Jenkins initial admin password
echo "=========================================="
echo "Jenkins Master Setup Complete!"
echo "=========================================="
echo "Access Jenkins at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
echo ""
echo "Get initial admin password:"
echo "docker exec jenkins-master cat /var/jenkins_home/secrets/initialAdminPassword"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Access Jenkins UI and complete initial setup"
echo "2. Install required plugins:"
echo "   - Pipeline"
echo "   - Git"
echo "   - Docker Pipeline"
echo "   - Kubernetes CLI"
echo "   - SonarQube Scanner"
echo "3. Configure Jenkins agent:"
echo "   - Manage Jenkins -> Manage Nodes -> New Node"
echo "   - Name: jenkins-slave"
echo "   - Launch method: Launch agent by connecting it to the controller"
echo "4. Configure credentials:"
echo "   - dockerhub-credentials"
echo "   - sonarqube-token"
echo "   - nexus-credentials"
echo "5. Create CI pipeline job using jenkins/Jenkinsfile-CI"
echo "6. Create CD pipeline job using jenkins/Jenkinsfile-CD"
echo "=========================================="
