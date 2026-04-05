package window

import (
	"os/exec"
	"runtime"
	"strings"
	"unsafe"

	webview "github.com/webview/webview_go"
)

/*
#cgo windows LDFLAGS: -luser32 -ldwmapi -lcomctl32
#cgo linux pkg-config: gtk+-3.0

#include "window_native.h"
*/
import "C"

type Window struct {
	config  WindowConfig
	webview webview.WebView
}

type WindowConfig struct {
	Title  string
	Width  int
	Height int
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
		// zkus zenity (GTK), pak kdialog (KDE)
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
	wv := webview.New(false)

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

	wv.Init(`
    window.api = {
        openSelectDirectoryDialog: () => window.__openFolderPicker(),
			beginWindowDrag: (x, y) => window.__beginWindowDrag(x, y),
			windowClose: () => window.__windowClose(),
			windowMinimize: () => window.__windowMinimize(),
			windowMaximize: () => window.__windowMaximize(),
			windowRestore: () => window.__windowRestore(),
			windowIsMaximized: () => window.__windowIsMaximized(),
    }
`)

	return &Window{
		config:  config,
		webview: wv,
	}
}

func (w *Window) Destroy() {
	w.webview.Destroy()
}

func (w *Window) Open(url string) {
	w.webview.SetTitle(w.config.Title)
	w.webview.SetSize(w.config.Width, w.config.Height, webview.HintNone)

	w.webview.Navigate(url)

	// Make frameless must run on UI thread
	w.webview.Dispatch(func() {
		handle := w.webview.Window()
		C.make_window_frameless(unsafe.Pointer(handle))
	})

	w.webview.Run()
}
