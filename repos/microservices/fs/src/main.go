package main

import (
	"context"
	"log"
	"net"
	"os"
	"path/filepath"
	"sync"

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

func (s *fsServer) ReadFile(ctx context.Context, req *pb.ReadFileRequest) (*pb.ReadFileResponse, error) {
	content, err := os.ReadFile(req.Path)
	if err != nil {
		return nil, err
	}

	return &pb.ReadFileResponse{Content: string(content)}, nil
}

// sem limits concurrent goroutines for TreeDir walks.
var sem = make(chan struct{}, 32)

func (s *fsServer) TreeDir(ctx context.Context, req *pb.TreeDirRequest) (*pb.TreeDirResponse, error) {
	maxDepth := int(req.Depth)

	var mu sync.Mutex
	var entries []*pb.FileEntry
	var wg sync.WaitGroup

	var walk func(dir string, depth int)

	walk = func(dir string, depth int) {
		defer wg.Done()

		dirEntries, err := os.ReadDir(dir)
		if err != nil {
			return
		}

		batch := make([]*pb.FileEntry, 0, len(dirEntries))

		for _, e := range dirEntries {
			name := e.Name()

			// Skip hidden files/dirs
			if name[0] == '.' {
				continue
			}

			fullPath := filepath.Join(dir, name)
			isDir := e.IsDir()

			var fileType string
			if isDir {
				fileType = "directory"
			} else {
				fileType = "file"
			}

			batch = append(batch, &pb.FileEntry{
				Name: name,
				Path: fullPath,
				Type: fileType,
			})

			// Recurse into subdirectories
			if isDir && (maxDepth == 0 || depth+1 < maxDepth) {
				wg.Add(1)

				select {
				case sem <- struct{}{}:
					// Got a slot — run in a new goroutine
					go func(d string, dep int) {
						walk(d, dep)
						<-sem
					}(fullPath, depth+1)
				default:
					// All slots busy — run inline to avoid blocking
					walk(fullPath, depth+1)
				}
			}
		}

		mu.Lock()
		entries = append(entries, batch...)
		mu.Unlock()
	}

	wg.Add(1)
	walk(req.Path, 0)
	wg.Wait()

	return &pb.TreeDirResponse{Entries: entries}, nil
}

func (s *fsServer) WriteFile(ctx context.Context, req *pb.WriteFileRequest) (*pb.Empty, error) {
	file, err := os.OpenFile(req.Path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return nil, err
	}

	defer file.Close()

	_, err = file.Write([]byte(req.Content))
	if err != nil {
		return nil, err
	}

	file.Sync()

	return &pb.Empty{}, nil
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
