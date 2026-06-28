#!/bin/bash
set -e

echo "=== SonarQube Setup on Docker ==="

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "Error: Docker is not running"
    exit 1
fi

echo "Pulling images..."
docker pull postgres:15-alpine
docker pull sonarqube:lts-community

echo "Creating PostgreSQL for SonarQube..."
docker run -d \
  --name sonar-postgres \
  --restart unless-stopped \
  -p 5433:5432 \
  -e POSTGRES_USER=sonar \
  -e POSTGRES_PASSWORD=sonar \
  -e POSTGRES_DB=sonar \
  -v sonar_postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

echo "Waiting for PostgreSQL to be ready..."
sleep 15

echo "Creating SonarQube container..."
docker run -d \
  --name sonarqube \
  --restart unless-stopped \
  -p 9000:9000 \
  --link sonar-postgres:sonar-postgres \
  -e SONAR_JDBC_URL=jdbc:postgresql://sonar-postgres:5432/sonar \
  -e SONAR_JDBC_USERNAME=sonar \
  -e SONAR_JDBC_PASSWORD=sonar \
  -v sonarqube_data:/opt/sonarqube/data \
  sonarqube:lts-community

echo "Waiting for SonarQube to start..."
sleep 60

echo "=== SonarQube Setup Complete ==="
echo "Access SonarQube at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):9000"
echo "Default credentials: admin / admin"
