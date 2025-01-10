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
              response = sem6000.request_measurement()

              print("Current measurement:")
              if response.is_power_active:
                     print("\tPower:\t\t\tOn")
              else:
                     print("\tPower:\t\t\tOff")

              power_in_milliwatt = response.power_in_milliwatt
              voltage_in_volt = response.voltage_in_volt
              current_in_milliampere = response.current_in_milliampere
              frequency_in_hertz = response.frequency_in_hertz
              total_consumption_in_kilowatt_hour = response.total_consumption_in_kilowatt_hour

              print("\tPower:\t\t\t" + str(power_in_milliwatt) + " mW")
              print("\tVoltage:\t\t" + str(voltage_in_volt) + " V")
              print("\tCurrent:\t\t" + str(current_in_milliampere) + " mA")
              print("\tFrequency:\t\t" + str(frequency_in_hertz) + " Hz")
              print("\tTotal consumption:\t" + str(total_consumption_in_kilowatt_hour) + " kWh")
              