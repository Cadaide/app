package app

import (
	"os"
	"path/filepath"
)

func IsDevModeEnabled() bool {
	return os.Getenv("CADAIDE_DEV") == "1"
}

func GetHomeDir() string {
	home := os.Getenv("HOME")
	if home != "" {
		return home
	}

	return os.Getenv("USERPROFILE")
}

func GetConfigDir() string {
	home := GetHomeDir()

	if IsDevModeEnabled() {
		return filepath.Join(home, ".cadaide-dev")
	}

	return filepath.Join(home, ".cadaide")
}
