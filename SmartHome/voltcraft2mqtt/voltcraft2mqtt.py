#!/usr/bin/python3

import time
import json
import sys
import threading
import logging

from sem6000 import sem6000 as sem6000Module
from sem6000.message import *
from sem6000 import util
from paho.mqtt import client as mqttClientModule
from pythonjsonlogger.jsonlogger import JsonFormatter

logger = logging.getLogger(__name__)
logHandler = logging.StreamHandler()
formatter = JsonFormatter(
       "{levelname}{message}", 
       style="{",
       rename_fields={"levelname": "level"})
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.DEBUG)

CLIENT_ID = "voltcraft2mqtt"
BROKER = "docker.fritz.box"
PORT = 1883
Sem6000Lock = threading.Lock()

def connectToMqtt():
       def on_connect(client, userdata, flags, rc, properties):
              if rc == 0:
                     logger.info("Connected to MQTT Broker!")
              else:
                     logger.error("Failed to connect, return code %d\n", rc)
   
       logger.info("Create MQTT client")
       mqttClient = mqttClientModule.Client(client_id=CLIENT_ID, callback_api_version=mqttClientModule.CallbackAPIVersion.VERSION2)
       # client.username_pw_set(username, password)
       mqttClient.on_connect = on_connect
       mqttClient.will_set("sem6000/openmediavault/available", "offline")
       logger.info("Connecting to MQTT")
       mqttClient.connect(BROKER, PORT)

       return mqttClient

def setDeviceInHaAsAvailable(mqttClient: mqttClientModule):
       logger.info("Set device in HomeAssistant as available")
       result = mqttClient.publish("sem6000/openmediavault/available", "online")

def setPowerStateInHaToOff(mqttClient: mqttClientModule):
       logger.info("Set power state in HomeAssistant to OFF")
       result = mqttClient.publish("sem6000/openmediavault/switch/state", "OFF")

def setPowerStateInHaToOn(mqttClient: mqttClientModule):
       logger.info("Set power state in HomeAssitant to ON")
       result = mqttClient.publish("sem6000/openmediavault/switch/state", "ON")
      
def initialize():
       logger.info("Initializing voltcraft2mqtt")
       mqttClient = connectToMqtt()
       setDeviceInHaAsAvailable(mqttClient)
       setPowerStateInHaToOff(mqttClient)
       logger.info("Subscribe to command topic")
       subscribeToCommandTopic(mqttClient)
       
       return mqttClient

def sendSem6000SensorValuesToHa(mqttClient: mqttClientModule):
       logger.info("Send SEM6000 sensor values to HomeAssistant")
       deviceAddr = sys.argv[1]

       with Sem6000Lock:
              sem6000Client = sem6000Module.SEM6000(deviceAddr, debug=False)
              response = sem6000Client.request_measurement()
              sem6000Client.disconnect()

       payload = {}

       logger.info(response)
       if response.is_power_active:
              setPowerStateInHaToOn(mqttClient)
              payload["PowerSwitch"] = 1
       else:
              setPowerStateInHaToOff(mqttClient)
              payload["PowerSwitch"] = 0
              
       payload["PowerInMilliWatt"] = response.power_in_milliwatt
       payload["VoltageInVolt"] = response.voltage_in_volt
       payload["CurrentInMilliAmpere"] = response.current_in_milliampere
       payload["ConsumptionInKiloWattPerHour"] = response.total_consumption_in_kilowatt_hour
       
       payloadJson = json.dumps(payload)
       result = mqttClient.publish("sem6000/openmediavault/sensor/values", payloadJson)

def switchPowerState(newSwitchState: str):
       logger.info("Switch power state")
       deviceAddr = sys.argv[1]
       pin = sys.argv[2]

       with Sem6000Lock:
              sem6000Client = sem6000Module.SEM6000(deviceAddr, debug=False)
              sem6000Client.authorize(pin)
              if newSwitchState == "ON":
                     sem6000Client.power_on()
              elif newSwitchState == "OFF":
                     sem6000Client.power_off()
              sem6000Client.disconnect()

def subscribeToCommandTopic(mqttClient: mqttClientModule):
    def on_message(client, userdata, msg):
       switchPowerState(msg.payload.decode())     
       sendSem6000SensorValuesToHa(mqttClient)         
              
    mqttClient.subscribe("sem6000/openmediavault/switch/set")
    mqttClient.on_message = on_message

def run(mqttClient: mqttClientModule):
       logger.info("Start main loop")
       mqttClient.loop_start()

       while True:
              sendSem6000SensorValuesToHa(mqttClient)
              logger.info("Sleep 300s")
              time.sleep(300)

       mqttClient.loop_stop()

if __name__ == '__main__':
       if len(sys.argv) < 1:
              scriptname = sys.argv[0]
              logger.error("Usage:")
              logger.error("\t" + scriptname + " <address> <pin> <command>")
       else:
              mqttClient = initialize()
              run(mqttClient)
