# PowerShell script to keep Chrome app window always on top
# This runs in background and continuously forces the window to stay on top

Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class Win32 {
        [DllImport("user32.dll")]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

        public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
        public const uint SWP_NOMOVE = 0x0002;
        public const uint SWP_NOSIZE = 0x0001;
    }
"@

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "AI Interview Assistant - Always On Top Helper" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoring for AI Interview Assistant window..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

$found = $false
$lastCheck = Get-Date

while ($true) {
    Start-Sleep -Milliseconds 500

    # Try to find window by different possible titles
    $titles = @(
        "localhost:5173",
        "AI Interview Assistant",
        "http://localhost:5173"
    )

    foreach ($title in $titles) {
        $hwnd = [Win32]::FindWindow($null, $title)

        if ($hwnd -ne [IntPtr]::Zero) {
            # Force window to stay on top
            [Win32]::SetWindowPos($hwnd, [Win32]::HWND_TOPMOST, 0, 0, 0, 0,
                [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE) | Out-Null

            if (-not $found) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✓ Found window: '$title'" -ForegroundColor Green
                Write-Host "    Window is now pinned on top!" -ForegroundColor Green
                $found = $true
            }

            # Update status every 10 seconds
            if (((Get-Date) - $lastCheck).TotalSeconds -gt 10) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Still monitoring... Window stays on top" -ForegroundColor Gray
                $lastCheck = Get-Date
            }

            break
        }
    }

    if (-not $found) {
        # Still searching
        if (((Get-Date) - $lastCheck).TotalSeconds -gt 5) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Waiting for window to appear..." -ForegroundColor Yellow
            $lastCheck = Get-Date
        }
    }
}
