"""Synthetic Linux acceptance only: confirm a destination in CVForge's own native dialog.

Uses XTest only on the dialog transient for the exact Electron window supplied
by the harness. No clipboard, arbitrary foreground window or personal files.
"""
import ctypes as c
from ctypes.util import find_library
from pathlib import Path
import sys
import time

parent = int(sys.argv[1])
destination = Path(sys.argv[2])
assert str(destination).startswith('/tmp/cvforge-f7-ui-') and destination.name == 'native-preview.pdf'
x = c.CDLL(find_library('X11'))
xt = c.CDLL(find_library('Xtst'))
D, W = c.c_void_p, c.c_ulong
x.XOpenDisplay.restype = D
x.XDefaultRootWindow.argtypes = [D]
x.XDefaultRootWindow.restype = W
x.XQueryTree.argtypes = [D, W, c.POINTER(W), c.POINTER(W), c.POINTER(c.POINTER(W)), c.POINTER(c.c_uint)]
x.XFetchName.argtypes = [D, W, c.POINTER(c.c_void_p)]
x.XGetTransientForHint.argtypes = [D, W, c.POINTER(W)]
x.XFree.argtypes = [c.c_void_p]
x.XRaiseWindow.argtypes = [D, W]
x.XSetInputFocus.argtypes = [D, W, c.c_int, c.c_ulong]
x.XFlush.argtypes = [D]
display = x.XOpenDisplay(None)
assert display, 'X11 display unavailable'

def find(window, depth=0):
    if depth > 5:
        return None
    transient, name = W(), c.c_void_p()
    if x.XGetTransientForHint(display, window, c.byref(transient)) and transient.value == parent:
        if x.XFetchName(display, window, c.byref(name)) and name:
            text = c.string_at(name).decode('utf-8', errors='replace')
            x.XFree(name)
            if text == 'Exportar PDF':
                return window
    root, owner, children, count = W(), W(), c.POINTER(W)(), c.c_uint()
    if x.XQueryTree(display, window, c.byref(root), c.byref(owner), c.byref(children), c.byref(count)):
        ids = [children[i] for i in range(min(count.value, 10000))]
        if children:
            x.XFree(children)
        for child in ids:
            found = find(child, depth + 1)
            if found:
                return found
    return None

dialog = None
for _ in range(100):
    dialog = find(x.XDefaultRootWindow(display))
    if dialog:
        break
    time.sleep(.1)
assert dialog, 'CVForge native save dialog not found'
time.sleep(1)
x.XRaiseWindow(display, dialog)
x.XFlush(display)
time.sleep(.2)
x.XSetInputFocus(display, dialog, 1, 0)

# The harness opens the real dialog in its synthetic directory with this filename.
class Attributes(c.Structure):
    _fields_ = [(n, c.c_int) for n in ['x', 'y', 'width', 'height', 'border', 'depth']] + [('visual', D), ('root', W)] + [(n, c.c_int) for n in ['window_class', 'bit_gravity', 'win_gravity', 'backing_store']] + [('backing_planes', W), ('backing_pixel', W), ('save_under', c.c_int), ('colormap', W), ('map_installed', c.c_int), ('map_state', c.c_int)] + [(n, c.c_long) for n in ['all_events', 'your_events', 'no_propagate']] + [('override', c.c_int), ('screen', D)]
x.XGetWindowAttributes.argtypes = [D, W, c.POINTER(Attributes)]
x.XTranslateCoordinates.argtypes = [D, W, W, c.c_int, c.c_int, c.POINTER(c.c_int), c.POINTER(c.c_int), c.POINTER(W)]
xt.XTestFakeMotionEvent.argtypes = [D, c.c_int, c.c_int, c.c_int, c.c_ulong]
xt.XTestFakeButtonEvent.argtypes = [D, c.c_uint, c.c_int, c.c_ulong]
for _ in range(40):
    if destination.is_file():
        print('Native file destination selected and PDF saved')
        sys.exit(0)
    current = find(x.XDefaultRootWindow(display))
    attrs = Attributes()
    if current == dialog and x.XGetWindowAttributes(display, dialog, c.byref(attrs)) and attrs.map_state == 2:
        assert attrs.width > 300 and attrs.height > 200
        rx, ry, child = c.c_int(), c.c_int(), W()
        assert x.XTranslateCoordinates(display, dialog, x.XDefaultRootWindow(display), 0, 0, c.byref(rx), c.byref(ry), c.byref(child))
        xt.XTestFakeMotionEvent(display, -1, rx.value + attrs.width - 45, ry.value + attrs.height - 22, 0)
        xt.XTestFakeButtonEvent(display, 1, 1, 0)
        xt.XTestFakeButtonEvent(display, 1, 0, 0)
        x.XFlush(display)
    time.sleep(.4)
raise RuntimeError('Native save did not create the selected synthetic PDF')
