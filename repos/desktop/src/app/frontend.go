package app

import (
	"cadaide/src/binaries"
	"cadaide/src/shell"
	"os"
	"os/exec"
	"path/filepath"
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

	bunBinary := binaries.GetBunBinaryPath()

	cmd, err := shell.RunHidden(shell.RunOptions{
		Command: []string{bunBinary, "server.js"},
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
