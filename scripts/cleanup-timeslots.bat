@echo off
cd %~dp0\..
echo Time Slot Cleanup Utility
echo -----------------------
echo.

echo Available commands:
echo.
echo 1. Delete a single time slot by ID
echo 2. Delete time slots in a date range
echo 3. Delete all unused time slots
echo 4. Delete ALL time slots (WARNING: This will delete all appointment data!)
echo 5. Exit
echo.

:MENU
set /p choice=Enter your choice (1-5): 

if "%choice%"=="1" goto DELETE_ONE
if "%choice%"=="2" goto DELETE_RANGE
if "%choice%"=="3" goto DELETE_UNUSED
if "%choice%"=="4" goto DELETE_ALL
if "%choice%"=="5" goto END

echo Invalid choice. Please try again.
goto MENU

:DELETE_ONE
set /p id=Enter time slot ID to delete: 
node scripts\cleanup-timeslots.js delete %id%
pause
goto END

:DELETE_RANGE
set /p startDate=Enter start date (YYYY-MM-DD): 
set /p endDate=Enter end date (YYYY-MM-DD): 
node scripts\cleanup-timeslots.js delete-range %startDate% %endDate%
pause
goto END

:DELETE_UNUSED
node scripts\cleanup-timeslots.js delete-unused
pause
goto END

:DELETE_ALL
echo.
echo WARNING: This will delete ALL time slots and related appointment data!
echo This operation cannot be undone.
echo.
set /p confirm=Are you sure you want to continue? (y/n): 
if /i not "%confirm%"=="y" goto MENU
echo.
echo Deleting all time slots...
node scripts\cleanup-timeslots.js delete-all
pause
goto END

:END
echo Done.
