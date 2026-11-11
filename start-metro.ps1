Start-Job -ScriptBlock {
    cd 'E:\MY-APPS\findmybus\Archive\findmybus'
    npx expo start > 'metro-session5.log' 2>&1
} -Name expoMetro5
