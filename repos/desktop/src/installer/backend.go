package installer

import (
	"cadaide/src/binaries"
	"cadaide/src/shell"
	"log"
	"os"
	"path/filepath"
)

func ensureBackendModulesInstalled() {
	cwd, _ := os.Getwd()
	backendDir := filepath.Join(cwd, "../backend")

	_, err := os.Stat(filepath.Join(backendDir, "node_modules"))
	if err == nil || !os.IsNotExist(err) {
		log.Println("Backend modules already installed")
		return
	}

	bunBinary := binaries.GetBunBinaryPath()

	err = shell.RunHiddenSync(shell.RunOptions{
		Command: []string{bunBinary, "install", "--frozen-lockfile"},
		Cwd:     backendDir,
		Env:     map[string]string{},
	})
	if err != nil {
		log.Println("Failed to install backend modules")
		panic(err)
	}
}
