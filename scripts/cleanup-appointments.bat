@echo off
cd %~dp0\..
echo Appointment Cleanup Utility
echo -----------------------
echo.

echo Available commands:
echo.
echo 1. Delete ALL appointments (keeps time slots and admin data)
echo 2. Delete appointments in a date range
echo 3. Exit
echo.

:MENU
set /p choice=Enter your choice (1-3): 

if "%choice%"=="1" goto DELETE_ALL
if "%choice%"=="2" goto DELETE_RANGE
if "%choice%"=="3" goto END

echo Invalid choice. Please try again.
goto MENU

:DELETE_ALL
echo WARNING: This will delete ALL appointments in the database.
echo Admin data and time slots will remain intact.
set /p confirm=Are you sure you want to continue? (Y/N): 
if /i "%confirm%"=="Y" (
  node scripts\cleanup-appointments.js delete-all
) else (
  echo Operation cancelled.
)
pause
goto END

:DELETE_RANGE
set /p startDate=Enter start date (YYYY-MM-DD): 
set /p endDate=Enter end date (YYYY-MM-DD): 
node scripts\cleanup-appointments.js delete-range %startDate% %endDate%
pause
goto END

:END
echo Done.
