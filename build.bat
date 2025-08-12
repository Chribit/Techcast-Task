@echo off

RMDIR /S /Q "%CD%\dist"
mkdir "%CD%\dist"
mkdir "%CD%\dist\httpdocs"

call npx webpack --config webpack.config.js

call css-minify "--file" "./src/httpdocs/index.css" "--output" "./dist/httpdocs"
call css-minify "--file" "./src/httpdocs/admin/index.css" "--output" "./dist/httpdocs/admin"

REN "%CD%\dist\httpdocs\index.min.css" "index.css"
REN "%CD%\dist\httpdocs\admin\index.min.css" "index.css"

call tsc "--project" "tsconfig.server.json"

robocopy "%CD%\src\httpdocs\images" "%CD%\dist\httpdocs\images" /E /NFL /NDL /NJH /NJS /nc /ns /np
robocopy "%CD%\src\httpdocs\admin\images" "%CD%\dist\httpdocs\admin\images" /E /NFL /NDL /NJH /NJS /nc /ns /np
