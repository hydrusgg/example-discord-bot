@echo off

set /p DISCORD_TOKEN="Insert your discord bot token: "
set /p GUILD_ID="Insert your discord server/guild id: "
set /p TOKEN="Insert your hydrus script token: "

echo DISCORD_TOKEN=%DISCORD_TOKEN% > .env
echo GUILD_ID=%GUILD_ID% >> .env
echo TOKEN=%TOKEN% >> .env

node -v 2> Nul
if "%errorlevel%" == "9009" (
  echo Node.JS isn't installed in your machine
) else (
  call npm ci
  CLS
  echo Finished!
  echo @echo off > Start.bat
  echo node index.js >> Start.bat
  echo PAUSE >> Start.bat
)

PAUSE