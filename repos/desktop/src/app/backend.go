package app

import (
	"cadaide/src/binaries"
	"cadaide/src/shell"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"
)

func RunBackendInDevMode(port int) (*exec.Cmd, error) {
	cwd, _ := os.Getwd()

	log.Printf("Starting backend in dev mode on port %d...\n", port)

	cmd, err := shell.RunHidden(shell.RunOptions{
		Command: []string{"bun", "run", "start:dev"},
		Cwd:     filepath.Join(cwd, "../backend"),
		Env: map[string]string{
			"NODE_ENV":       "development",
			"FS_BINARY_PATH": filepath.Join(cwd, "../microservices/fs/build/fs"),
			"PORT":           strconv.Itoa(port),
		},
	})
	if err != nil {
		panic(err)
	}

	return cmd, nil
}

func RunBackend(port int) (*exec.Cmd, error) {
	cwd, _ := os.Getwd()

	log.Printf("Starting backend in production mode on port %d...\n", port)

	bunBinary := binaries.GetBunBinaryPath()
	fsBinary := binaries.GetFSBinaryPath()

	cmd, err := shell.RunHidden(shell.RunOptions{
		Command: []string{bunBinary, "main.js"},
		Cwd:     filepath.Join(cwd, "../backend"),
		Env: map[string]string{
			"NODE_ENV":        "production",
			"FS_BINARY_PATH":  fsBinary,
			"BUN_BINARY_PATH": bunBinary,
			"PORT":            strconv.Itoa(port),
		},
	})
	if err != nil {
		panic(err)
	}

	return cmd, nil
}

func WaitForBackend(port int) {
	for {
		resp, err := http.Get(fmt.Sprintf("http://localhost:%d/health", port))
		if err != nil {
			time.Sleep(100 * time.Millisecond)
			continue
		}

		if resp.StatusCode == 200 {
			return
		}

		time.Sleep(100 * time.Millisecond)
	}
}
