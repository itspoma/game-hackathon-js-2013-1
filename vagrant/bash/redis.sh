#!/bin/sh

set -e # Exit script immediately on first error.
set -x # Print commands and their arguments as they are executed.

echo "!! redis"

if ! [ -f /status-redis ];
then
    echo "!! redis .."

    mv /etc/redis/redis.conf /etc/redis/redis.old.conf
    apt-get -y -o DPkg::options::=--force-confmiss --reinstall install redis-server
    /etc/init.d/redis-server restart

    sudo touch /status-redis
fi