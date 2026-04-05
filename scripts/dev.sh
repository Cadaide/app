#!/usr/bin/env bash

# Build microservices
# - build fs microservice
cd repos/microservices/fs
go build -o build/fs src/main.go
cd ../../..

# Start desktop
cd repos/desktop
CADAIDE_DEV=1 go run src/main.go
