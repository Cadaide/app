package app

import (
	"cadaide/src/shell"
	"cadaide/src/window"
	"time"
)

func RunInDevMode() {
	frontendCmd, err := RunFrontendInDevMode()
	if err != nil {
		panic(err)
	}

	defer shell.KillGroup(frontendCmd)

	backendCmd, err := RunBackendInDevMode()
	if err != nil {
		panic(err)
	}

	defer shell.KillGroup(backendCmd)

	w := window.New(window.WindowConfig{
		Title:          "Cadaide (DEV MODE)",
		Width:          1280,
		Height:         720,
		EnableDevtools: false, // TODO: Figure out how to enable -- lags the whole app
	})

	defer w.Destroy()

	w.Open("http://localhost:3000")
}

func Run() {
	frontendCmd, err := RunFrontend()
	if err != nil {
		panic(err)
	}

	defer shell.KillGroup(frontendCmd)

	backendCmd, err := RunBackend()
	if err != nil {
		panic(err)
	}

	defer shell.KillGroup(backendCmd)

	w := window.New(window.WindowConfig{
		Title:          "Cadaide",
		Width:          1280,
		Height:         720,
		EnableDevtools: false,
	})

	defer w.Destroy()

	time.Sleep(10 * time.Second)

	w.Open("http://127.0.0.1:3000")
}
