package main

import (
	"cadaide/src/app"
	"cadaide/src/logger"
	"log"
)

func main() {
	// TODO: Set proper path
	logger.Init("./logs")
	log.Println("Application starting...")

	defer func() {
		log.Println("Application stopping... Goodbye!")
		logger.Close()
	}()

	if app.IsDevModeEnabled() {
		app.RunInDevMode()
	} else {
		app.Run()
	}

	/*f, _ := os.OpenFile("cadaide.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	defer f.Close()
	log.SetOutput(f)

	isDev := os.Getenv("CADAIDE_DEV") == "1"

	var appdir string
	if isDev {
		appdir = ".."
	} else {
		appdir = os.Getenv("APPDIR")
	}

	log.Println(appdir)

	if isDev {
		log.Println("Running in development mode")
	} else {
		log.Println("Running in production mode")
	}

	var bunBinary string
	if os.Getenv("OS") == "Windows_NT" {
		bunBinary = "bun.exe"
	} else {
		bunBinary = "bun"
	}

	var fsBinary string
	if os.Getenv("OS") == "Windows_NT" {
		fsBinary = "fs.exe"
	} else {
		fsBinary = "fs"
	}

	var frontendDir string
	var backendDir string
	var fsDir string

	if isDev {
		frontendDir = "./frontend"
		backendDir = "./backend"
		fsDir = "./microservices/fs"
	} else {
		frontendDir = "pkg/frontend"
		backendDir = "pkg/backend"
		fsDir = "pkg/microservices/fs"
	}

	var frontendCmd []string
	var backendCmd []string
	if isDev {
		frontendCmd = []string{bunBinary, "run", "dev"}
		backendCmd = []string{bunBinary, "run", "start:dev"}
	} else {
		frontendCmd = []string{bunBinary, "server.js"}
		backendCmd = []string{bunBinary, "main.js"}
	}

	var beEnv map[string]string
	if isDev {
		beEnv = map[string]string{
			"NODE_ENV":       "development",
			"FS_BINARY_PATH": filepath.Join(appdir, fsDir+"/"+fsBinary),
		}
	} else {
		beEnv = map[string]string{
			"NODE_ENV":        "production",
			"FS_BINARY_PATH":  filepath.Join(appdir, fsDir+"/"+fsBinary),
			"BUN_BINARY_PATH": filepath.Join(appdir, "bin/"+bunBinary),
		}
	}

	go runCommand(appdir, frontendCmd, frontendDir, map[string]string{
		"PORT":     "3000",
		"HOSTNAME": "127.0.0.1",
	}, true)

	go runCommand(appdir, backendCmd, backendDir, beEnv, true)

	w := window.New(window.WindowConfig{
		Title:  "Cadaide",
		Width:  1280,
		Height: 720,
	})

	defer w.Destroy()

	w.Open("http://localhost:3000")*/
}
