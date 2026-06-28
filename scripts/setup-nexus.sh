#!/bin/bash
set -e

echo "=== Nexus Repository Manager Setup on Docker ==="

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "Error: Docker is not running"
    exit 1
fi

echo "Pulling Nexus image..."
docker pull sonatype/nexus3:latest

echo "Creating Nexus container..."
docker run -d \
  --name nexus \
  --restart unless-stopped \
  -p 8081:8081 \
  -e INSTALL4J_ADD_VM_PARAMS="-Xms1200m -Xmx1200m -XX:MaxDirectMemorySize=2g" \
  -v nexus_data:/nexus-data \
  sonatype/nexus3:latest

echo "Waiting for Nexus to start..."
sleep 60

echo "Getting initial admin password..."
docker exec nexus cat /nexus-data/admin.password 2>/dev/null || echo "Check password manually"

echo "=== Nexus Setup Complete ==="
echo "Access Nexus at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8081"
echo "Default credentials: admin / (password from above)"
