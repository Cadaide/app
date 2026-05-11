package app

import (
	"cadaide/src/net"
	"cadaide/src/shell"
	"cadaide/src/window"
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

func RunInDevMode() {
	frontendPort := net.GetRandomAvailablePort()
	backendPort := net.GetRandomAvailablePort()

	frontendCmd, err := RunFrontendInDevMode(frontendPort, backendPort)
	if err != nil {
		panic(err)
	}

	defer shell.KillGroup(frontendCmd)

	backendCmd, err := RunBackendInDevMode(backendPort)
	if err != nil {
		panic(err)
	}

	defer shell.KillGroup(backendCmd)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigChan
		shell.KillGroup(frontendCmd)
		shell.KillGroup(backendCmd)
		os.Exit(0)
	}()

	WaitForBackend(backendPort)
	WaitForFrontend(frontendPort)

	w := window.New(window.WindowConfig{
		Title:          "Cadaide (DEV MODE)",
		Width:          1280,
		Height:         720,
		EnableDevtools: false, // TODO: Figure out how to enable -- lags the whole app
	})

	w.BindRestartServer(func() error {
		shell.KillGroup(backendCmd)

		cmd, err := RunBackendInDevMode(backendPort)
		if err != nil {
			return err
		}

		backendCmd = cmd
		WaitForBackend(backendPort)

		return nil
	})

	defer w.Destroy()

	w.Open(fmt.Sprintf("http://localhost:%d", frontendPort))
}

func Run() {
	frontendPort := net.GetRandomAvailablePort()
	backendPort := net.GetRandomAvailablePort()

	frontendCmd, err := RunFrontend(frontendPort, backendPort)
	if err != nil {
		panic(err)
	}

	defer shell.KillGroup(frontendCmd)

	backendCmd, err := RunBackend(backendPort)
	if err != nil {
		panic(err)
	}

	defer shell.KillGroup(backendCmd)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-sigChan
		shell.KillGroup(frontendCmd)
		shell.KillGroup(backendCmd)
		os.Exit(0)
	}()

	WaitForBackend(backendPort)
	WaitForFrontend(frontendPort)

	w := window.New(window.WindowConfig{
		Title:          "Cadaide",
		Width:          1280,
		Height:         720,
		EnableDevtools: false,
	})

	w.BindRestartServer(func() error {
		shell.KillGroup(backendCmd)

		cmd, err := RunBackend(backendPort)
		if err != nil {
			return err
		}

		backendCmd = cmd
		WaitForBackend(backendPort)

		return nil
	})

	defer w.Destroy()

	w.Open(fmt.Sprintf("http://127.0.0.1:%d", frontendPort))
}
