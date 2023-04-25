#!/usr/bin/env python3

import sys
import time
from sem6000 import SEMSocket

import bluepy

socket = None

while True:
    try:
        if socket == None:
            print("Connect to SEMSocket", file =sys.stderr)
            socket = SEMSocket('F0:C7:7F:1C:89:19')
            print("Login ", file =sys.stderr)
            socket.login("0000")

        socket.getStatus()
        print("Sem6000,Socket=Keller powered={}".format("1" if socket.powered else "0"))
        print("Sem6000,Socket=Keller voltage={}".format(socket.voltage))
        print("Sem6000,Socket=Keller current={}".format(socket.current))
        print("Sem6000,Socket=Keller power={}".format(socket.power))
        print("Wait 10min", file =sys.stderr)
        time.sleep(600)
    except Exception as ex:
        print("Unexpected Exception:", ex, file =sys.stderr)

        if socket != None:
            print("Disconnect from SEMSocket", file =sys.stderr)
            socket.disconnect()
            socket = None

        print("Retry in 5s", file =sys.stderr)
        time.sleep(5)
