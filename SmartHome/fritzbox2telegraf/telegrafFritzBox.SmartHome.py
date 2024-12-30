#!/opt/bin/python3

# This script is for exporting FritzBox metrics into Telegraf in InfluxDB format.
# https://github.com/Schmidsfeld/TelegrafFritzBox
# License: MIT (https://opensource.org/licenses/MIT)
# Author: Alexander von Schmidsfeld

# This script requires the FritzConnection package
# Install with:
# pip3 install fritzconnection

from fritzconnection import FritzConnection
from fritzconnection.cli.utils import get_cli_arguments
from ping3 import ping
import sys
import itertools

# Helper modules for extracting and parsing variables
def readfritz(module, action):
    try:
        answer = fc.call_action(module, action)
    except:
        answer = dict() # return an empty dict in case of failure
    return answer

def extractvar(answer, variable, integer=False, string=True, name=""):
    if variable in answer.keys():
        avar = str(answer[variable])
        avar = avar.replace('"','')
        if name == "plainValue":
           return avar

        if name == "":
            name = variable
        if integer:
            avar = name + '=' + avar +'i' # format for integers in influxDB
        else:
            if string:
                avar = name + '="' + avar +'"' # format for strings in influxDB
            else:
                avar = name + '=' + avar # format for float/double in influxDB
    else:
        avar = ''
    return avar

def assemblevar(*args):
    data = ','.join(list(args))+','
    #cleaning up output
    data = data.replace("New", "")
    data = data.replace(",,",",")
    data = data.replace(",,",",")
    data = data.replace(",,",",")
    data = data.replace(",,",",")
    data = data[:-1]
    return data

def influxrow(tag, data):
    influx = measurementName + ',source=' + tag + ' ' + data
    print(influx)

# Connect to the FritzBox
args = get_cli_arguments()

# At first check whether FritzBox is switched on
fritzBoxAvailable = ping(args.address)
if not fritzBoxAvailable:
    sys.exit(1)

try:
    fc = FritzConnection(address=args.address, user=args.username, password=args.password, port=args.port, timeout=10.0)
except BaseException:
    print(BaseException)
    print("Cannot connect to fritzbox. ")
    sys.exit(1)

fritzInfo = readfritz('LANHostConfigManagement1', 'GetInfo')
measurementName =  extractvar(fritzInfo, 'NewDomainName', False, False, 'plainValue')

# Iterate over all known smarthome device and generate one influxDB line per device 
for n in itertools.count():
    try:
        device = fc.call_action('X_AVM-DE_Homeauto1', 'GetGenericDeviceInfos', NewIndex=n)
    except IndexError:
        break

    manufacturer = extractvar(device, 'NewManufacturer', False, False, 'plainValue')
    if manufacturer != 'AVM':
        continue

    name = extractvar(device, 'NewDeviceName', False, False)
    name = name.replace('NewDeviceName=','') 
    power = extractvar(device, 'NewMultimeterPower', True, False, 'Power') # Power currently consumed in W *100
    energy = extractvar(device, 'NewMultimeterEnergy', True, False, 'Energy') # Energy consumed in Wh
    temperature = extractvar(device, 'NewTemperatureCelsius', True, False, 'Temperature') # Temperature in celcius * 10
    homeDevice = assemblevar(power, energy, temperature)
    influxrow(name, homeDevice)
