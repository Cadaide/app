package window

import (
	"log"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"unsafe"

	webview "github.com/webview/webview_go"
	lorca "github.com/zserge/lorca"
)

/*
#cgo windows LDFLAGS: -luser32 -ldwmapi -lcomctl32
#cgo linux pkg-config: gtk+-3.0
#cgo darwin CFLAGS: -x objective-c
#cgo darwin LDFLAGS: -framework Cocoa

#include "window_native.h"
*/
import "C"

type Window struct {
	config   WindowConfig
	webview  webview.WebView
	lorca    lorca.UI
	useLorca bool
}

type WindowConfig struct {
	Title          string
	Width          int
	Height         int
	EnableDevtools bool
}

func macOSMajorVersion() int {
	if runtime.GOOS != "darwin" {
		return 0
	}
	out, err := exec.Command("sw_vers", "-productVersion").Output()
	if err != nil {
		return 0
	}
	parts := strings.Split(strings.TrimSpace(string(out)), ".")
	if len(parts) == 0 {
		return 0
	}
	v, _ := strconv.Atoi(parts[0])
	return v
}

func pickFolder() string {
	switch runtime.GOOS {
	case "windows":
		cmd := exec.Command("powershell", "-Command", `
			Add-Type -AssemblyName System.Windows.Forms
			$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
			$dialog.Description = 'Select installation folder'
			$result = $dialog.ShowDialog()
			if ($result -eq 'OK') { $dialog.SelectedPath }
		`)
		out, err := cmd.Output()
		if err != nil {
			return ""
		}
		return strings.TrimSpace(string(out))

	case "darwin":
		cmd := exec.Command("osascript", "-e", `
			POSIX path of (choose folder with prompt "Select installation folder")
		`)
		out, err := cmd.Output()
		if err != nil {
			return ""
		}
		return strings.TrimSpace(string(out))

	case "linux":
		for _, tool := range [][]string{
			{"zenity", "--file-selection", "--directory", "--title=Select installation folder"},
			{"kdialog", "--getexistingdirectory", "."},
		} {
			cmd := exec.Command(tool[0], tool[1:]...)
			out, err := cmd.Output()
			if err != nil {
				continue
			}
			return strings.TrimSpace(string(out))
		}
		return ""
	}

	return ""
}

func New(config WindowConfig) *Window {
	useLorca := macOSMajorVersion() <= 12 && runtime.GOOS == "darwin"

	if useLorca {
		return newLorcaWindow(config)
	}
	return newWebviewWindow(config)
}

func newLorcaWindow(config WindowConfig) *Window {
	ui, err := lorca.New("", "", config.Width, config.Height, "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check")
	if err != nil {
		log.Printf("lorca error: %v", err)
		return newWebviewWindow(config)
	}
	if ui == nil {
		log.Printf("lorca ui is nil")
		return newWebviewWindow(config)
	}

	ui.Bind("__openFolderPicker", func() string {
		return pickFolder()
	})

	ui.Bind("__beginWindowDrag", func(x, y int) {})
	ui.Bind("__windowClose", func() { ui.Close() })
	ui.Bind("__windowMinimize", func() {})
	ui.Bind("__windowMaximize", func() {})
	ui.Bind("__windowRestore", func() {})
	ui.Bind("__windowIsMaximized", func() int { return 0 })
	ui.Bind("__windowLog", func(msg string) { log.Println(msg) })

	ui.Eval(`
		window.api = {
			platform: "native",
			openSelectDirectoryDialog: () => window.__openFolderPicker(),
			beginWindowDrag: (x, y) => window.__beginWindowDrag(x, y),
			windowClose: () => window.__windowClose(),
			windowMinimize: () => window.__windowMinimize(),
			windowMaximize: () => window.__windowMaximize(),
			windowRestore: () => window.__windowRestore(),
			windowIsMaximized: () => window.__windowIsMaximized(),
		}

		console.log = (...args) => window.__windowLog(args.join(" "));
	`)

	return &Window{
		config:   config,
		lorca:    ui,
		useLorca: true,
	}
}

func newWebviewWindow(config WindowConfig) *Window {
	wv := webview.New(config.EnableDevtools)

	wv.Bind("__openFolderPicker", func() string {
		return pickFolder()
	})

	wv.Bind("__beginWindowDrag", func(x, y int) {
		handle := wv.Window()
		C.begin_drag(unsafe.Pointer(handle), C.int(x), C.int(y))
	})

	wv.Bind("__windowClose", func() {
		C.window_close(unsafe.Pointer(wv.Window()))
	})

	wv.Bind("__windowMinimize", func() {
		C.window_minimize(unsafe.Pointer(wv.Window()))
	})

	wv.Bind("__windowMaximize", func() {
		C.window_maximize(unsafe.Pointer(wv.Window()))
	})

	wv.Bind("__windowRestore", func() {
		C.window_restore(unsafe.Pointer(wv.Window()))
	})

	wv.Bind("__windowIsMaximized", func() int {
		return int(C.window_is_maximized(unsafe.Pointer(wv.Window())))
	})

	wv.Bind("__windowLog", func(msg string) { log.Println(msg) })

	wv.Init(`
		window.api = {
			platform: "native",
			openSelectDirectoryDialog: () => window.__openFolderPicker(),
			beginWindowDrag: (x, y) => window.__beginWindowDrag(x, y),
			windowClose: () => window.__windowClose(),
			windowMinimize: () => window.__windowMinimize(),
			windowMaximize: () => window.__windowMaximize(),
			windowRestore: () => window.__windowRestore(),
			windowIsMaximized: () => window.__windowIsMaximized(),
		}

		console.log = (...args) =>
			window.__windowLog(
				args
					.map((arg) =>
						typeof arg === "object" ? JSON.stringify(arg) : arg,
					)
					.join(" "),
			);
	`)

	return &Window{
		config:   config,
		webview:  wv,
		useLorca: false,
	}
}

func (w *Window) Destroy() {
	if w.useLorca {
		w.lorca.Close()
	} else {
		w.webview.Destroy()
	}
}

func (w *Window) Open(url string) {
	log.Println("Using Lorca: ", w.useLorca)

	if w.useLorca {
		w.lorca.Load(url)
		<-w.lorca.Done()
		return
	}

	w.webview.SetTitle(w.config.Title)
	w.webview.SetSize(w.config.Width, w.config.Height, webview.HintNone)
	w.webview.Navigate(url)

	w.webview.Dispatch(func() {
		handle := w.webview.Window()
		C.make_window_frameless(unsafe.Pointer(handle))
	})

	w.webview.Run()
}
