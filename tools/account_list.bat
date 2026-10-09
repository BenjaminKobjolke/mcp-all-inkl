@echo off
rem Lists all subaccounts of the KAS account. Extra arguments are passed through, e.g. --pick account_login
rem Credentials: KAS_LOGIN / KAS_PASSWORD from the environment or from .env in the project root.
setlocal
set "ROOT=%~dp0.."
if exist "%ROOT%\.env" (
  node "--env-file=%ROOT%\.env" "%ROOT%\dist\index.js" account list %*
) else (
  node "%ROOT%\dist\index.js" account list %*
)
exit /b %ERRORLEVEL%
