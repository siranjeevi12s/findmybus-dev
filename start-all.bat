@echo off
cd /d E:\MY-APPS\findmybus\Archive\findmybus
start "Metro" cmd /c "npx expo start > metro.log 2>&1"
cd /d E:\MY-APPS\findmybus\Archive\Server
start "API-Server" cmd /c "node index.js > server.log 2>&1"
timeout /t 15 >nul
adb -s emulator-5554 shell am force-stop com.siranjeevi12s.findmybus >nul 2>&1
adb -s emulator-5554 shell am start -n com.siranjeevi12s.findmybus/com.siranjeevi12s.findmybus.MainActivity
adb -s emulator-5556 shell am force-stop com.siranjeevi12s.findmybus >nul 2>&1
adb -s emulator-5556 shell am start -n com.siranjeevi12s.findmybus/com.siranjeevi12s.findmybus.MainActivity
echo ==========================================
echo Application started on both emulators
echo Metro: http://localhost:8081
echo API Server: http://localhost:5001
echo ==========================================
