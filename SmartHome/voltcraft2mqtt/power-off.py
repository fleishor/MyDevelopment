#!/usr/bin/python3

from sem6000 import sem6000
from sem6000.message import *
from sem6000 import util

import datetime
import sys


if __name__ == '__main__':
       if len(sys.argv) < 1:
              scriptname = sys.argv[0]
              print("Usage:" , file=sys.stderr)
              print("\t" + scriptname + " <address> <pin> <command>" , file=sys.stderr)
       else:
              deviceAddr = sys.argv[1]
              pin = sys.argv[2]

              sem6000 = sem6000.SEM6000(deviceAddr, debug=False)
              sem6000.authorize(pin)
              sem6000.power_on()
              