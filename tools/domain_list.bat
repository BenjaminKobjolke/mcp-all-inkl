@echo off
rem Lists all domains of the KAS account. Extra arguments are passed through, e.g. --pick domain_name
rem Credentials: KAS_LOGIN / KAS_PASSWORD from the environment or from .env in the project root.
setlocal
set "ROOT=%~dp0.."
if exist "%ROOT%\.env" (
  node "--env-file=%ROOT%\.env" "%ROOT%\dist\index.js" domain list %*
) else (
  node "%ROOT%\dist\index.js" domain list %*
)
exit /b %ERRORLEVEL%
