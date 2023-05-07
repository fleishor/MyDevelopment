#!/usr/bin/env python3

import sys
import time
from sem6000 import SEMSocket

import bluepy

socket = None
retryCounter = 0

while retryCounter < 5:
    try:
        if socket == None:
            print("Connect to SEMSocket", file =sys.stderr)
            socket = SEMSocket('F0:C7:7F:1C:89:19')
            print("Login ", file =sys.stderr)
            socket.login("1234")

        print("GetStatus ", file =sys.stderr)
        socket.getStatus()

        print("Sem6000,Socket=Keller powered={}".format("1" if socket.powered else "0"))
        print("Sem6000,Socket=Keller voltage={}".format(socket.voltage))
        print("Sem6000,Socket=Keller current={}".format(socket.current))
        print("Sem6000,Socket=Keller power={}".format(socket.power))

        print("Wrote values to Influx", file =sys.stderr)

        if socket != None:
            print("Disconnect from SEMSocket", file =sys.stderr)
            socket.disconnect()
            socket = None

        break;
    except Exception as ex:
        print("Unexpected Exception:", ex, file =sys.stderr)

        if socket != None:
            print("Disconnect from SEMSocket", file =sys.stderr)
            socket.disconnect()
            socket = None

        retryCounter = retryCounter + 1
        print("Retry in 5s", file =sys.stderr)
        time.sleep(5)
