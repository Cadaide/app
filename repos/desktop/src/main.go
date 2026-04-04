package main

import (
	"cadaide/src/window"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	appdir := os.Getenv("APPDIR")

	fmt.Println(appdir)

	go runCommand(appdir, []string{"bun", "server.js"}, "pkg/frontend", map[string]string{
		"PORT":     "3000",
		"HOSTNAME": "127.0.0.1",
	})

	go runCommand(appdir, []string{"bun", "main.js"}, "pkg/backend", map[string]string{
		"NODE_ENV":       "production",
		"FS_BINARY_PATH": filepath.Join(appdir, "pkg/microservices/fs/fs"),
	})

	w := window.New(window.WindowConfig{
		Title:  "Cadaide",
		Width:  1280,
		Height: 720,
	})

	defer w.Destroy()

	w.Open("http://localhost:3000")
}

func runCommand(appdir string, command []string, dir string, env map[string]string) error {
	cmd := exec.Command(command[0], command[1:]...)

	cmd.Dir = filepath.Join(appdir, dir)

	cmd.Env = append(os.Environ(), "PATH="+appdir+":"+os.Getenv("PATH"))
	for k, v := range env {
		cmd.Env = append(cmd.Env, k+"="+v)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
