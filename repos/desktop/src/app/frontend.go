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

func RunFrontendInDevMode(port int, bePort int) (*exec.Cmd, error) {
	cwd, _ := os.Getwd()

	log.Printf("Starting frontend in dev mode on port %d...\n", port)

	cmd, err := shell.RunHidden(shell.RunOptions{
		Command: []string{"bun", "run", "dev"},
		Cwd:     filepath.Join(cwd, "../frontend"),
		Env: map[string]string{
			"PORT":                     strconv.Itoa(port),
			"HOSTNAME":                 "127.0.0.1",
			"NEXT_PUBLIC_BACKEND_PORT": strconv.Itoa(bePort),
		},
	})
	if err != nil {
		panic(err)
	}

	return cmd, nil
}

func RunFrontend(port int, bePort int) (*exec.Cmd, error) {
	cwd, _ := os.Getwd()

	log.Printf("Starting frontend in production mode on port %d...\n", port)

	nodeBinary := binaries.GetNodeBinaryPath()

	cmd, err := shell.RunHidden(shell.RunOptions{
		Command: []string{nodeBinary, "server.js"},
		Cwd:     filepath.Join(cwd, "../frontend"),
		Env: map[string]string{
			"PORT":                     strconv.Itoa(port),
			"HOSTNAME":                 "127.0.0.1",
			"NEXT_PUBLIC_BACKEND_PORT": strconv.Itoa(bePort),
		},
	})
	if err != nil {
		panic(err)
	}

	return cmd, nil
}

func WaitForFrontend(port int) {
	for {
		resp, err := http.Get(fmt.Sprintf("http://localhost:%d", port))
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
