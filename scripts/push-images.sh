#!/bin/bash
set -e

DOCKERHUB_USERNAME=${1:-"your-dockerhub-username"}
VERSION=${2:-"latest"}

echo "=== Pushing E-Commerce Docker Images ==="
echo "DockerHub Username: ${DOCKERHUB_USERNAME}"
echo "Version: ${VERSION}"
echo ""

# Login to DockerHub
echo "Logging in to DockerHub..."
docker login

# Push all images
echo ""
echo "Pushing images..."
docker push ${DOCKERHUB_USERNAME}/api-gateway:${VERSION}
docker push ${DOCKERHUB_USERNAME}/product-service:${VERSION}
docker push ${DOCKERHUB_USERNAME}/order-service:${VERSION}
docker push ${DOCKERHUB_USERNAME}/user-service:${VERSION}
docker push ${DOCKERHUB_USERNAME}/frontend:${VERSION}

# Also push latest tags
if [ "${VERSION}" != "latest" ]; then
    echo ""
    echo "Pushing latest tags..."
    docker push ${DOCKERHUB_USERNAME}/api-gateway:latest
    docker push ${DOCKERHUB_USERNAME}/product-service:latest
    docker push ${DOCKERHUB_USERNAME}/order-service:latest
    docker push ${DOCKERHUB_USERNAME}/user-service:latest
    docker push ${DOCKERHUB_USERNAME}/frontend:latest
fi

echo ""
echo "=== Push Complete ==="
