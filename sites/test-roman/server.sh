# node server/server.js
supervisor --watch server/,server/views/ --extensions js,html --debug server/server.js