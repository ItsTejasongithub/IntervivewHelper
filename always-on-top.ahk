; AutoHotkey script to keep AI Interview Assistant always on top
; Press Ctrl+Alt+T to toggle always-on-top for the active window

#Persistent
SetTimer, CheckWindow, 500

CheckWindow:
    ; Find the Chrome app window by title
    WinGet, id, ID, AI Interview Assistant
    if (id)
    {
        WinSet, AlwaysOnTop, On, ahk_id %id%
    }

    ; Also check for localhost:5173 in title
    WinGet, id2, ID, localhost:5173
    if (id2)
    {
        WinSet, AlwaysOnTop, On, ahk_id %id2%
    }
return

; Hotkey: Ctrl+Alt+T to manually toggle always-on-top for active window
^!t::
    WinGet, currentWindow, ID, A
    WinGet, ExStyle, ExStyle, ahk_id %currentWindow%
    if (ExStyle & 0x8)  ; 0x8 is WS_EX_TOPMOST
    {
        WinSet, AlwaysOnTop, Off, ahk_id %currentWindow%
        TrayTip, Always On Top, Window is no longer on top, 1
    }
    else
    {
        WinSet, AlwaysOnTop, On, ahk_id %currentWindow%
        TrayTip, Always On Top, Window is now always on top, 1
    }
return

; Press Ctrl+Alt+Q to exit this script
^!q::
    ExitApp
return
