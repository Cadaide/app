package net

import (
	"fmt"
	"math/rand"
	"net"
	"time"
)

func GetRandomAvailablePort() int {
	rand.Seed(time.Now().UnixNano())

	port := rand.Intn(65536-1024) + 1024
	if IsPortAvailable(port) {
		return port
	}

	return GetRandomAvailablePort()
}

func IsPortAvailable(port int) bool {
	addr := fmt.Sprintf("127.0.0.1:%d", port)

	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return false
	}

	listener.Close()

	return true
}
