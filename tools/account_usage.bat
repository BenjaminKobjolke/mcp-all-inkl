@echo off
rem Resource totals of the KAS account plus quota and usage per subaccount.
rem Credentials: KAS_LOGIN / KAS_PASSWORD from the environment or from .env in the project root.
rem Real cronjob/database/ftpuser counts per subaccount need KAS_PASSWORD_<login> for that subaccount.
setlocal
set "ROOT=%~dp0.."
if exist "%ROOT%\.env" (
  node "--env-file=%ROOT%\.env" "%ROOT%\dist\index.js" account usage %*
) else (
  node "%ROOT%\dist\index.js" account usage %*
)
exit /b %ERRORLEVEL%
