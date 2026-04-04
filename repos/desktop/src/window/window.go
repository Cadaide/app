package window

import (
	"unsafe"

	webview "github.com/webview/webview_go"
)

/*
#cgo windows LDFLAGS: -luser32
#cgo linux pkg-config: gtk+-3.0

#ifdef _WIN32
#include <windows.h>

void make_frameless(void* hwnd) {
    HWND h = (HWND)hwnd;
    LONG style = GetWindowLong(h, GWL_STYLE);
    style &= ~(WS_CAPTION | WS_THICKFRAME | WS_MINIMIZE | WS_MAXIMIZE | WS_SYSMENU);
    SetWindowLong(h, GWL_STYLE, style);
    SetWindowPos(h, NULL, 0, 0, 0, 0,
        SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);
}
#else
#include <gtk/gtk.h>

void make_frameless(void* widget) {
    gtk_window_set_decorated(GTK_WINDOW(widget), FALSE);
}
#endif
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

func New(config WindowConfig) *Window {
	wv := webview.New(false)

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
		C.make_frameless(unsafe.Pointer(handle))
	})

	w.webview.Run()
}
