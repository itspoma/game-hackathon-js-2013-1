#!/bin/sh

set -e # Exit script immediately on first error.
set -x # Print commands and their arguments as they are executed.

echo "!! utf8"

if ! [ -f /status-utf8 ];
then
    echo "!! utf8 .."

    echo LC_ALL='en_GB.UTF-8' > /etc/default/locale

    export LC_ALL='en_GB.UTF-8'
    locale-gen en_US.UTF-8 
    locale-gen en_US.UTF-8
    dpkg-reconfigure locales

    sudo touch /status-utf8
fi