#ifdef __APPLE__
#import <Cocoa/Cocoa.h>

void make_window_frameless(void *handle) {}
void begin_drag(void *handle, int x, int y) {}
void window_close(void *handle) {}
void window_minimize(void *handle) {}
void window_maximize(void *handle) {}
void window_restore(void *handle) {}
int window_is_maximized(void *handle) { return 0; }
#endif