#!/bin/bash

# k3s Deployment Script for E-Commerce Demo
# This script deploys the optimized k3s manifests for low-resource demo

set -e

echo "=========================================="
echo "E-Commerce k3s Deployment Script"
echo "=========================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check if k3s is running
if ! kubectl get nodes &> /dev/null; then
    echo "Error: Cannot connect to k3s cluster"
    exit 1
fi

echo "✓ kubectl is available and connected to k3s"

# Check if kustomize is available
if command -v kustomize &> /dev/null; then
    echo "✓ kustomize is available"
    USE_KUSTOMIZE=true
else
    echo "⚠ kustomize not found, using manual deployment"
    USE_KUSTOMIZE=false
fi

# Ask for DockerHub username
read -p "Enter your DockerHub username: " DOCKERHUB_USERNAME

if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo "Error: DockerHub username is required"
    exit 1
fi

echo "✓ Using DockerHub username: $DOCKERHUB_USERNAME"

# Update image tags in manifests
echo "=========================================="
echo "Updating image tags in manifests..."
echo "=========================================="

cd k8s/k3s-demo-ultra

# Replace placeholder username
sed -i "s|your-dockerhub-username|$DOCKERHUB_USERNAME|g" *.yaml

cd ../..

# Deploy
echo "=========================================="
echo "Deploying to k3s..."
echo "=========================================="

if [ "$USE_KUSTOMIZE" = true ]; then
    echo "Using Kustomize deployment..."
    kubectl apply -k k8s/k3s-demo-ultra
else
    echo "Using manual deployment..."
    
    # Apply storage class
    echo "Applying storage class..."
    kubectl apply -f k8s/k3s-demo-ultra/storageclass.yaml
    
    # Apply ConfigMaps
    echo "Applying ConfigMaps..."
    kubectl apply -f k8s/k3s-demo-ultra/configmap-*.yaml
    
    # Apply Secrets
    echo "Applying Secrets..."
    kubectl apply -f k8s/k3s-demo-ultra/secret-*.yaml
    
    # Deploy PostgreSQL
    echo "Deploying PostgreSQL..."
    kubectl apply -f k8s/k3s-demo-ultra/statefulset-postgres.yaml
    
    # Wait for PostgreSQL
    echo "Waiting for PostgreSQL to be ready..."
    kubectl rollout status statefulset/postgres --timeout=300s
    
    # Deploy backend services
    echo "Deploying backend services..."
    kubectl apply -f k8s/k3s-demo-ultra/deployment-product-service.yaml
    kubectl apply -f k8s/k3s-demo-ultra/deployment-order-service.yaml
    kubectl apply -f k8s/k3s-demo-ultra/deployment-user-service.yaml
    kubectl apply -f k8s/k3s-demo-ultra/deployment-api-gateway.yaml
    
    # Wait for backend services
    echo "Waiting for backend services..."
    kubectl rollout status deployment/product-service --timeout=120s
    kubectl rollout status deployment/order-service --timeout=120s
    kubectl rollout status deployment/user-service --timeout=120s
    kubectl rollout status deployment/api-gateway --timeout=120s
    
    # Deploy frontend
    echo "Deploying frontend..."
    kubectl apply -f k8s/k3s-demo-ultra/deployment-frontend.yaml
    kubectl rollout status deployment/frontend --timeout=120s
    
    # Apply ingress
    echo "Applying Traefik ingress..."
    kubectl apply -f k8s/k3s-demo-ultra/ingress.yaml
fi

# Verify deployment
echo "=========================================="
echo "Verifying deployment..."
echo "=========================================="

echo "Pods:"
kubectl get pods -o wide

echo ""
echo "Services:"
kubectl get services

echo ""
echo "Ingress:"
kubectl get ingress

echo ""
echo "PostgreSQL StatefulSet:"
kubectl get statefulset postgres

# Get node IP
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "Access URLs:"
echo "  Frontend: http://$NODE_IP/"
echo "  API: http://$NODE_IP/api/"
echo "  Traefik Dashboard: http://$NODE_IP:8080/"
echo ""
echo "PostgreSQL:"
echo "  Check pods: kubectl get pods -l app=postgres"
echo "  Restart pod: kubectl delete pod postgres-0"
echo "=========================================="
