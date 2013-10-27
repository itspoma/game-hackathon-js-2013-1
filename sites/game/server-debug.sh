# run server for testing
echo "WARNING (!) DEBUG MODE = ON"
node node_modules/supervisor/lib/cli-wrapper.js --watch server/,server/views/ --extensions js,html --debug -- server/server.js -debug