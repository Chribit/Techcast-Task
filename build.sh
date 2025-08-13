rm -rf ./dist
mkdir ./dist
mkdir ./dist/httpdocs

npx webpack --config webpack.config.js

css-minify --file ./src/httpdocs/index.css --output ./dist/httpdocs
css-minify --file ./src/httpdocs/admin/index.css --output ./dist/httpdocs/admin

rename -e "s/.min.css/.css/" ./dist/httpdocs/*

tsc --project ./tsconfig.server.json

cp -r ./src/httpdocs/images ./dist/httpdocs/images
cp -r ./src/httpdocs/admin/images ./dist/httpdocs/admin/images
