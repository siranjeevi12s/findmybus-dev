@echo off
cd /d E:\MY-APPS\findmybus\Archive\findmybus

REM Start Metro in background
start "Metro" cmd /c "npx expo start > metro-final.log 2>&1"

REM Wait for Metro to be ready
timeout /t 15 >nul

REM Launch both emulators with fresh bundles
adb -s emulator-5554 shell am force-stop com.siranjeevi12s.findmybus >nul 2>&1
adb -s emulator-5554 shell am start -n com.siranjeevi12s.findmybus/com.siranjeevi12s.findmybus.MainActivity
adb -s emulator-5556 shell am force-stop com.siranjeevi12s.findmybus >nul 2>&1
adb -s emulator-5556 shell am start -n com.siranjeevi12s.findmybus/com.siranjeevi12s.findmybus.MainActivity

echo Done launching emulators
