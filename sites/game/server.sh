# build js
./node_modules/requirejs/bin/r.js -o www/r.build.js

# run server on production
node node_modules/supervisor/lib/cli-wrapper.js --watch server/,server/views/ --extensions js,html server/server.js