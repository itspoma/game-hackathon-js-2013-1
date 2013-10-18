#!/bin/sh

set -e # Exit script immediately on first error.
set -x # Print commands and their arguments as they are executed.

echo "!! npm"

if ! [ -f /status-npm ];
then
    echo "!! npm .."

    # npm install express -g
    # npm install socket.io -g
    # npm install hiredis redis -g
    # npm install requirejs -g
    # npm install jquery -g
    
    # npm install -g nodemon
    npm install supervisor -g

    sudo touch /status-npm
fi