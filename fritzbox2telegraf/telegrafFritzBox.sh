#!/bin/sh
export PATH=${PATH}:/home/fritzbox/.local/bin
python3 /home/fritzbox/telegrafFritzBox.4040.py -u ${BUERO_USERNAME} -p ${BUERO_PASSWORD} -i ${BUERO_ADDRESS} | nc -q 1 ${TELEGRAF_HOSTNAME} ${TELEGRAF_PORT}
python3 /home/fritzbox/telegrafFritzBox.7490.py -u ${ROUTER_USERNAME} -p ${ROUTER_PASSWORD} -i ${ROUTER_ADDRESS} | nc -q 1 ${TELEGRAF_HOSTNAME} ${TELEGRAF_PORT}
python3 /home/fritzbox/telegrafFritzBox.SmartHome.py -u ${ROUTER_USERNAME} -p ${ROUTER_PASSWORD} -i ${ROUTER_ADDRESS} | nc -q 1 ${TELEGRAF_HOSTNAME} ${TELEGRAF_PORT}
