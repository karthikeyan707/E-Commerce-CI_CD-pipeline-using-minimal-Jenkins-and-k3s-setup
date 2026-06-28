#!/bin/bash
set -e

DOCKERHUB_USERNAME=${1:-"your-dockerhub-username"}
VERSION=${2:-"latest"}

echo "=== Building E-Commerce Docker Images ==="
echo "DockerHub Username: ${DOCKERHUB_USERNAME}"
echo "Version: ${VERSION}"
echo ""

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Build all images using docker-compose build file
echo "Building images..."
docker-compose -f docker-compose.build.yml build

# Tag with version
echo ""
echo "Tagging images with version: ${VERSION}"
docker tag ${DOCKERHUB_USERNAME}/api-gateway:latest ${DOCKERHUB_USERNAME}/api-gateway:${VERSION}
docker tag ${DOCKERHUB_USERNAME}/product-service:latest ${DOCKERHUB_USERNAME}/product-service:${VERSION}
docker tag ${DOCKERHUB_USERNAME}/order-service:latest ${DOCKERHUB_USERNAME}/order-service:${VERSION}
docker tag ${DOCKERHUB_USERNAME}/user-service:latest ${DOCKERHUB_USERNAME}/user-service:${VERSION}
docker tag ${DOCKERHUB_USERNAME}/frontend:latest ${DOCKERHUB_USERNAME}/frontend:${VERSION}

echo ""
echo "=== Build Complete ==="
echo ""
echo "Images built:"
docker images | grep "${DOCKERHUB_USERNAME}"
echo ""
echo "To push images to DockerHub:"
echo "  docker login"
echo "  ./scripts/push-images.sh ${DOCKERHUB_USERNAME} ${VERSION}"
