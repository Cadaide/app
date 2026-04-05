package app

import (
	"cadaide/src/binaries"
	"cadaide/src/shell"
	"os"
	"os/exec"
	"path/filepath"
)

func RunBackendInDevMode() (*exec.Cmd, error) {
	cwd, _ := os.Getwd()

	cmd, err := shell.RunHidden(shell.RunOptions{
		Command: []string{"bun", "run", "start:dev"},
		Cwd:     filepath.Join(cwd, "../backend"),
		Env: map[string]string{
			"NODE_ENV":       "development",
			"FS_BINARY_PATH": filepath.Join(cwd, "../microservices/fs/build/fs"),
		},
	})
	if err != nil {
		panic(err)
	}

	return cmd, nil
}

func RunBackend() (*exec.Cmd, error) {
	cwd, _ := os.Getwd()

	bunBinary := binaries.GetBunBinaryPath()

	fsBinary := binaries.GetFSBinaryPath()

	cmd, err := shell.RunHidden(shell.RunOptions{
		Command: []string{bunBinary, "main.js"},
		Cwd:     filepath.Join(cwd, "../backend"),
		Env: map[string]string{
			"NODE_ENV":        "production",
			"FS_BINARY_PATH":  fsBinary,
			"BUN_BINARY_PATH": bunBinary,
		},
	})
	if err != nil {
		panic(err)
	}

	return cmd, nil
}
