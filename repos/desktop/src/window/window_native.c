#include "window_native.h"

#ifdef _WIN32
#include <windows.h>

#include <commctrl.h>
#include <dwmapi.h>

#define GET_X_LPARAM(lp) ((int)(short)LOWORD(lp))
#define GET_Y_LPARAM(lp) ((int)(short)HIWORD(lp))

static LRESULT CALLBACK SubclassProc(HWND hWnd, UINT uMsg, WPARAM wParam,
                                     LPARAM lParam, UINT_PTR uIdSubclass,
                                     DWORD_PTR dwRefData) {
  if (uMsg == WM_NCCALCSIZE && wParam) {
    NCCALCSIZE_PARAMS *params = (NCCALCSIZE_PARAMS *)lParam;

    if (IsZoomed(hWnd)) {
      MONITORINFO mi = {sizeof(mi)};

      if (GetMonitorInfo(MonitorFromWindow(hWnd, MONITOR_DEFAULTTONEAREST),
                         &mi))
        params->rgrc[0] = mi.rcWork;

    } else {
      const int border_x =
          GetSystemMetrics(SM_CXFRAME) + GetSystemMetrics(SM_CXPADDEDBORDER);
      const int border_y =
          GetSystemMetrics(SM_CYFRAME) + GetSystemMetrics(SM_CXPADDEDBORDER);

      params->rgrc[0].left += border_x;
      params->rgrc[0].right -= border_x;
      params->rgrc[0].bottom -= border_y;
    }

    return 0;
  }

  return DefSubclassProc(hWnd, uMsg, wParam, lParam);
}

void make_window_frameless(void *handle) {
  HWND h = (HWND)handle;

  LONG style = GetWindowLong(h, GWL_STYLE);
  style |=
      WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU;
  SetWindowLong(h, GWL_STYLE, style);

  MARGINS margins = {0, 0, 0, 0};
  DwmExtendFrameIntoClientArea(h, &margins);

  SetWindowSubclass(h, SubclassProc, 1, 0);

  SetWindowPos(h, NULL, 0, 0, 0, 0,
               SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE |
                   SWP_FRAMECHANGED);
}

void begin_drag(void *handle, int x, int y) {
  HWND h = (HWND)handle;
  ReleaseCapture();
  SendMessage(h, WM_NCLBUTTONDOWN, HTCAPTION, 0);
}

void window_close(void *handle) { PostMessage((HWND)handle, WM_CLOSE, 0, 0); }

void window_minimize(void *handle) { ShowWindow((HWND)handle, SW_MINIMIZE); }

void window_maximize(void *handle) {
  HWND h = (HWND)handle;
  ShowWindow(h, SW_MAXIMIZE);
}

void window_restore(void *handle) {
  HWND h = (HWND)handle;
  ShowWindow(h, SW_RESTORE);
}

int window_is_maximized(void *handle) { return IsZoomed((HWND)handle) ? 1 : 0; }

#else
#include <gdk/gdk.h>
#include <gtk/gtk.h>

void make_window_frameless(void *handle) {
  gtk_window_set_decorated(GTK_WINDOW(handle), FALSE);
}

void begin_drag(void *handle, int x, int y) {
  gtk_window_begin_move_drag(GTK_WINDOW(handle), 1, x, y, GDK_CURRENT_TIME);
}

void window_close(void *handle) { gtk_window_close(GTK_WINDOW(handle)); }

void window_minimize(void *handle) { gtk_window_iconify(GTK_WINDOW(handle)); }

void window_maximize(void *handle) { gtk_window_maximize(GTK_WINDOW(handle)); }

void window_restore(void *handle) { gtk_window_unmaximize(GTK_WINDOW(handle)); }

int window_is_maximized(void *handle) {
  return gtk_window_is_maximized(GTK_WINDOW(handle)) ? 1 : 0;
}

#endif