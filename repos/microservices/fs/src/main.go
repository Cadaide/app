package main

import (
	"context"
	"log"
	"net"
	"os"

	pb "cadaide/fs/fs_pb"

	"google.golang.org/grpc"
)

type fsServer struct {
	pb.UnimplementedFsServiceServer
}

func (s *fsServer) ListDir(ctx context.Context, req *pb.ListDirRequest) (*pb.ListDirResponse, error) {
	dirs, err := os.ReadDir(req.Path)
	if err != nil {
		return nil, err
	}

	var entries []*pb.FileEntry

	for _, dir := range dirs {
		var fileType string

		if dir.Type().IsDir() {
			fileType = "directory"
		} else {
			fileType = "file"
		}

		entries = append(entries, &pb.FileEntry{
			Name: dir.Name(),
			Path: req.Path + "/" + dir.Name(),
			Type: fileType,
		})
	}

	return &pb.ListDirResponse{Entries: entries}, nil
}

func main() {
	socketPath := "./fs.sock"

	if err := os.RemoveAll(socketPath); err != nil {
		log.Fatalf("Failed to remove old socket: %v", err)
	}

	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		log.Fatalf("Failed to listen on socket: %v", err)
	}

	defer listener.Close()

	s := grpc.NewServer()
	pb.RegisterFsServiceServer(s, &fsServer{})

	if err := s.Serve(listener); err != nil {
		log.Fatalf("Server error: %v", err)
	}

	log.Printf("Fs microservice running...")
}
