package binaries

import (
	"os"
	"path/filepath"
)

// TODO: Cwd can sometimes be different, so we need to get the actual cwd
// depending on launch method
func GetBunBinaryPath() string {
	cwd, _ := os.Getwd()

	if os.Getenv("OS") == "Windows_NT" {
		return filepath.Join(cwd, "../../bin/bun.exe")
	}

	return filepath.Join(cwd, "../../bin/bun")
}

// TODO: Cwd can sometimes be different, so we need to get the actual cwd
// depending on launch method
func GetFSBinaryPath() string {
	cwd, _ := os.Getwd()

	if os.Getenv("OS") == "Windows_NT" {
		return filepath.Join(cwd, "../microservices/fs/fs.exe")
	}

	return filepath.Join(cwd, "../microservices/fs/fs")
}
