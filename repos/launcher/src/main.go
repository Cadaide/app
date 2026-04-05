//go:build windows

package main

import (
	"archive/zip"
	"bytes"
	"cadaide/launcher/src/cmdw"
	"cadaide/launcher/src/window"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	_ "embed"
)

// @cadaide:embed:pkg
var pkg []byte

//go:embed index.html
var index []byte

var (
	appdirPath = os.TempDir() + "/cadaide"
	binPath    = appdirPath + "/bin"
	pkgPath    = appdirPath + "/pkg"
)

func main() {
	f, _ := os.OpenFile("launcher.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	defer f.Close()
	log.SetOutput(f)

	if len(pkg) == 0 {
		panic("pkg is empty - embed failed")
	}

	w := window.New(window.WindowConfig{
		Title:  "Cadaide",
		Width:  400,
		Height: 200,
	})

	w.SetHTML(string(index))

	_, err := extractPkg(appdirPath)
	if err != nil {
		panic(err)
	}

	var bunBinary string
	if os.Getenv("OS") == "Windows_NT" {
		bunBinary = "bun.exe"
	} else {
		bunBinary = "bun"
	}

	go func() {
		err := runCommand([]string{filepath.Join(binPath, bunBinary), "install", "--frozen-lockfile"}, "/backend", nil, true)
		if err != nil {
			log.Println("command failed:", err)
		}
		w.Close() // signals Run() to return
	}()

	w.Run() // blocks until Close() is called
	w.Destroy()

	var binary string
	if os.Getenv("OS") == "Windows_NT" {
		binary = "cadaide.exe"
	} else {
		binary = "cadaide"
	}

	runCommand([]string{"./" + binary}, "/desktop", nil, false)
}

func extractPkg(dir string) (string, error) {
	r, err := zip.NewReader(bytes.NewReader(pkg), int64(len(pkg)))
	if err != nil {
		os.RemoveAll(dir)
		return "", err
	}

	for _, f := range r.File {
		destPath := filepath.Join(dir, f.Name)

		// zip slip protection
		if !filepath.IsLocal(f.Name) {
			os.RemoveAll(dir)
			return "", fmt.Errorf("invalid path in zip: %s", f.Name)
		}

		if f.FileInfo().IsDir() {
			os.MkdirAll(destPath, f.Mode())
			continue
		}

		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			os.RemoveAll(dir)
			return "", err
		}

		rc, err := f.Open()
		if err != nil {
			os.RemoveAll(dir)
			return "", err
		}

		out, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, f.Mode())
		if err != nil {
			rc.Close()
			os.RemoveAll(dir)
			return "", err
		}

		_, err = io.Copy(out, rc)
		rc.Close()
		out.Close()
		if err != nil {
			os.RemoveAll(dir)
			return "", err
		}
	}

	return dir, nil
}

func runCommand(command []string, dir string, env map[string]string, hideWindow bool) error {
	cmd := exec.Command(command[0], command[1:]...)

	cmd.Dir = filepath.Join(pkgPath, dir)

	var envSeparator string
	if os.Getenv("OS") == "Windows_NT" {
		envSeparator = ";"
	} else {
		envSeparator = ":"
	}

	cmd.Env = append(os.Environ(), "PATH="+binPath+envSeparator+os.Getenv("PATH"))
	for k, v := range env {
		cmd.Env = append(cmd.Env, k+"="+v)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if hideWindow {
		cmdw.SetSysProcAttr(cmd)
	}

	return cmd.Run()
}
