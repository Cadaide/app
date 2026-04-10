package installer

import "log"

func EnsureInstalled() {
	log.Println("Ensuring everything is installed...")

	ensureBackendModulesInstalled()
}
