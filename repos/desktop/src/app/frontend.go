package app

import (
	"cadaide/src/binaries"
	"cadaide/src/shell"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

func RunFrontendInDevMode() (*exec.Cmd, error) {
	cwd, _ := os.Getwd()

	cmd, err := shell.RunHidden(shell.RunOptions{
		Command: []string{"bun", "run", "dev"},
		Cwd:     filepath.Join(cwd, "../frontend"),
		Env:     map[string]string{},
	})
	if err != nil {
		panic(err)
	}

	return cmd, nil
}

func RunFrontend() (*exec.Cmd, error) {
	cwd, _ := os.Getwd()

	nodeBinary := binaries.GetNodeBinaryPath()

	cmd, err := shell.RunHidden(shell.RunOptions{
		Command: []string{nodeBinary, "server.js"},
		Cwd:     filepath.Join(cwd, "../frontend"),
		Env: map[string]string{
			"PORT":     "3000",
			"HOSTNAME": "127.0.0.1",
		},
	})
	if err != nil {
		panic(err)
	}

	return cmd, nil
}

func WaitForFrontend() {
	for {
		resp, err := http.Get("http://localhost:3000")
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
