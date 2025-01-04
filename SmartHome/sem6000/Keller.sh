#!/bin/bash
{ python3 Keller.py 2>&3 | socat - TCP:docker.fritz.box:8094; } 3>&1 | logger -i --priority cron.error --tag sem6000-Keller


