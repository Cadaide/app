package main

import (
	"cadaide/src/app"
	"cadaide/src/installer"
	"cadaide/src/logger"
	"log"
	"path/filepath"
)

func main() {
	logdir := app.GetConfigDir()
	logdir = filepath.Join(logdir, "logs")

	logger.Init(logdir)
	log.Println("Application starting...")

	installer.EnsureInstalled()

	defer func() {
		log.Println("Application stopping... Goodbye!")
		logger.Close()
	}()

	if app.IsDevModeEnabled() {
		app.RunInDevMode()
	} else {
		app.Run()
	}
}
