@echo off
echo ============================================================
echo   Starting AI Meeting Notes Agent (Project 8)
echo ============================================================
echo Compiling MeetingNotesServer.java ...
javac MeetingNotesServer.java
if %ERRORLEVEL% EQU 0 (
    echo Compilation successful!
    echo Starting Java Server at http://localhost:8080 ...
    echo Open your web browser to http://localhost:8080
    echo Press Ctrl+C to terminate the server.
    java MeetingNotesServer
) else (
    echo [ERROR] Java compilation failed. Make sure JDK 11+ is installed.
    pause
)
