#!/usr/bin/python3

from sem6000 import sem6000
from sem6000.message import *
from sem6000 import util

import datetime
import sys


if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == 'discover':    
        devices = sem6000.SEM6000.discover()
        for device in devices:
            print(device['name'] + '\t' + device['address'])
    elif len(sys.argv) < 2:
        scriptname = sys.argv[0]
        print("Usage:" , file=sys.stderr)
        print("\t" + scriptname + " [<address> <pin>] <command> [...]" , file=sys.stderr)
        print("\t\taddress:\tAddress of the bluetooth device to connect to, i.e. 00:11:22:33:44:55" , file=sys.stderr)
        print("\t\tpin:\t\t4-digit PIN of the device, i.e. 0000" , file=sys.stderr)
        print("\t\tcommand:\tOne of the following commands to execute on the device", file=sys.stderr)
        print("\t\t\tdiscover", file=sys.stderr)
        print("\t\t\t\tScans for devices in range", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\tget_hardware_version", file=sys.stderr)
        print("\t\t\t\tPrints the hardware version of the connected device", file=sys.stderr)
        print("\t\t\tchange_pin <new_pin>", file=sys.stderr)
        print("\t\t\t\tChanges the PIN", file=sys.stderr)
        print("\t\t\treset_pin", file=sys.stderr)
        print("\t\t\t\tResets the PIN to 0000", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\tpower_on", file=sys.stderr)
        print("\t\t\t\tPowers the switch on", file=sys.stderr)
        print("\t\t\tpower_off", file=sys.stderr)
        print("\t\t\t\tPowers the switch off", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\tnightmode_on", file=sys.stderr)
        print("\t\t\t\tTurn LED always off", file=sys.stderr)
        print("\t\t\tnightmode_off", file=sys.stderr)
        print("\t\t\t\tTurns the LED on when the switch is turned on", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\tchange_date_and_time <isodateandtime>", file=sys.stderr)
        print("\t\t\t\tSets date and time which must be provided in iso format, i.e. 2020-01-01T12:00:00. Setting date and time also  starts collection of consumption data", file=sys.stderr)
        print("\t\t\tsynchronize_date_and_time", file=sys.stderr)
        print("\t\t\t\tSets date and time of the device to the current system time", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\trequest_settings", file=sys.stderr)
        print("\t\t\t\tRequest current settings for power limit, prices and reduced period times", file=sys.stderr)
        print("\t\t\tchange_power_limit <power_limit_in_watt>", file=sys.stderr)
        print("\t\t\t\tSets the power limit in watt when the switch should be automatically turned off", file=sys.stderr)
        print("\t\t\tchange_prices <price_in_cent> <reduced_period_price_in_cent>", file=sys.stderr)
        print("\t\t\t\tSet prices for normal and reduced period", file=sys.stderr)
        print("\t\t\tchange_reduced_period <is_active> <start_isotime> <end_isotime>", file=sys.stderr)
        print("\t\t\t\tSet begin and end time of the reduced period", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\trequest_timer_status", file=sys.stderr)
        print("\t\t\t\tRequest the current status of the timer", file=sys.stderr)
        print("\t\t\tactivate_timer <turn_on?> <delay_isotime>", file=sys.stderr)
        print("\t\t\t\tActivates the timer to execute the switch action after the specified delay", file=sys.stderr)
        print("\t\t\tactivate_timer_at <turn_on?> <target_isodatetime>", file=sys.stderr)
        print("\t\t\t\tActivates the timer to execute the switch action at the specified date and time", file=sys.stderr)
        print("\t\t\treset_timer", file=sys.stderr)
        print("\t\t\t\tResets/stops the timer", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\trequest_scheduler", file=sys.stderr)
        print("\t\t\t\tRequest all scheduler entries", file=sys.stderr)
        print("\t\t\tadd_onetime_scheduler <is_active?> <turn_on?> <isodatetime>", file=sys.stderr)
        print("\t\t\t\tAdd a scheduler entry occuring at a specific date and time, i.e. True True 2020-01-01T12:00", file=sys.stderr)
        print("\t\t\tedit_onetime_scheduler <slot_id> <is_active?> <turn_on?> <isodatetime>", file=sys.stderr)
        print("\t\t\t\tEdit an existing scheduler entry occuring at a specific date and time, i.e. 12 True True 2020-01-01T12:00", file=sys.stderr)
        print("\t\t\tadd_repeated_scheduler <is_active?> <turn_on?> <repeat_on_weekdays> <isotime>", file=sys.stderr)
        print("\t\t\t\tAdd a scheduler entry that will be repeated regulary, i.e. True True Mon,Wed,Sun 12:00", file=sys.stderr)
        print("\t\t\tedit_repeated_scheduler <slot_id> <is_active?> <turn_on?> <repeat_on_weekdays> <isotime>", file=sys.stderr)
        print("\t\t\t\tEdit an existing scheduler entry that will be repeated regulary, i.e. 12 True True Mon,Wed,Fri 18:00", file=sys.stderr)
        print("\t\t\tremove_scheduler <slot_id>", file=sys.stderr)
        print("\t\t\t\tRemoves a scheduler entry", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\trequest_random_mode_status", file=sys.stderr)
        print("\t\t\t\tRequests current status of the random mode", file=sys.stderr)
        print("\t\t\tchange_random_mode <active_on_weekdays> <start_isotime> <end_isotime>", file=sys.stderr)
        print("\t\t\t\tSets random mode, i.e. True Mon,Wed,Sun 22:00 04:00", file=sys.stderr)
        print("\t\t\treset_random_mode", file=sys.stderr)
        print("\t\t\t\tResets random mode", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\trequest_measurement", file=sys.stderr)
        print("\t\t\t\tRequest current measurements", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\trequest_consumptions_of_last_12_months", file=sys.stderr)
        print("\t\t\t\tRequest accumulated measurements of last 12 months", file=sys.stderr)
        print("\t\t\trequest_consumptions_of_last_30_days", file=sys.stderr)
        print("\t\t\t\tRequest accumulated measurements of last 30 days", file=sys.stderr)
        print("\t\t\trequest_consumptions_of_last_23_hours", file=sys.stderr)
        print("\t\t\t\tRequest accumulated measurements of last 23 hours", file=sys.stderr)
        print("\t\t\treset_consumption", file=sys.stderr)
        print("\t\t\t\tResets collected consumption data", file=sys.stderr)
        print("", file=sys.stderr)
        print("\t\t\trequest_device_name", file=sys.stderr)
        print("\t\t\t\tRequests the device name", file=sys.stderr)
        print("\t\t\tchange_device_name <new_name>", file=sys.stderr)
        print("\t\t\t\tChanges the device name", file=sys.stderr)
        print("\t\t\tfactory_reset", file=sys.stderr)
        print("\t\t\t\tResets the device back to factory defaults", file=sys.stderr)
        print("\t\t\trequest_device_serial", file=sys.stderr)
        print("\t\t\t\tRequest the serial number of the device", file=sys.stderr)
    else:
        deviceAddr = sys.argv[1]
        pin = sys.argv[2]
        cmd = sys.argv[3]

        sem6000 = sem6000.SEM6000(deviceAddr, debug=True)

        if cmd != 'reset_pin' and cmd != 'get_device_name' and cmd != 'get_hardware_version':
            sem6000.authorize(pin)

        if cmd == 'get_hardware_version':
            print("Hardware version: " + str(sem6000.hardware_version))
        elif cmd == 'change_pin':
            sem6000.change_pin(sys.argv[4])
        elif cmd == 'reset_pin':
            sem6000.reset_pin()
        elif cmd == 'power_on':
            sem6000.power_on()
        elif cmd == 'power_off':
            sem6000.power_off()
        elif cmd == 'nightmode_on':
            sem6000.nightmode_on()
        elif cmd == 'nightmode_off':
            sem6000.nightmode_off()
        elif cmd == 'change_date_and_time':
            sem6000.change_date_and_time(sys.argv[4])
        elif cmd == 'synchronize_date_and_time':
            sem6000.change_date_and_time(datetime.datetime.now().isoformat())
        elif cmd == 'request_settings':
            response = sem6000.request_settings()
            assert isinstance(response, SettingsRequestedNotification)

            print("Settings:")
            if response.is_reduced_period:
                print("\tReduced mode:\t\t\tOn")
            else:
                print("\tReduced mode:\t\t\tOff")

            print("\tNormal price:\t\t\t{:.2f} EUR".format(response.normal_price_in_cent/100))
            print("\tReduced period price:\t\t{:.2f} EUR".format(response.reduced_period_price_in_cent/100))

            print("\tRecuced period start:\t\t{}".format(response.reduced_period_start_isotime))
            print("\tRecuced period end:\t\t{}".format(response.reduced_period_end_isotime))

            if response.is_nightmode_active:
                print("\tNightmode state:\t\tOn")
            else:
                print("\tNightmode state:\t\tOff")

            print("\tPower limit:\t\t\t{} W".format(response.power_limit_in_watt))
        elif cmd == 'change_power_limit':
            sem6000.change_power_limit(power_limit_in_watt=sys.argv[4])
        elif cmd == 'change_prices':
            sem6000.change_prices(normal_price_in_cent=sys.argv[4], reduced_period_price_in_cent=sys.argv[5])
        elif cmd == 'change_reduced_period':
            sem6000.change_reduced_period(is_active=sys.argv[4], start_isotime=sys.argv[5], end_isotime=sys.argv[6])
        elif cmd == 'request_timer_status':
            response = sem6000.request_timer_status()
            assert isinstance(response, TimerStatusRequestedNotification)

            original_timer_length = datetime.timedelta(seconds=response.original_timer_length_in_seconds)

            print("Timer Status:")
            if response.is_active:
                now = datetime.datetime.now()
                now = datetime.datetime(now.year, now.month, now.day, now.hour, now.minute, now.second)

                dt = datetime.datetime.fromisoformat(response.target_isodatetime)
                time_left = (dt - now)

                print("\tTimer state:\t\tOn")
                print("\tTime left:\t\t" + str(time_left))
                if response.is_action_turn_on:
                    print("\tAction:\t\t\tTurn On")
                else:
                    print("\tAction:\t\t\tTurn Off")
            else:
                print("\tTimer state:\t\tOff")

            print("\tOriginal timer length:\t" + str(original_timer_length))
        elif cmd == 'activate_timer':
            is_action_turn_on = sys.argv[4]
            delay_isotime = sys.argv[5]

            sem6000.activate_timer(is_action_turn_on=is_action_turn_on, delay_isotime=delay_isotime)
        elif cmd == 'activate_timer_at':
            is_action_turn_on = sys.argv[4]
            target_isodatetime = sys.argv[5]

            sem6000.activate_timer_at(is_action_turn_on=is_action_turn_on, target_isodatetime=target_isodatetime)
        elif cmd == 'reset_timer':
            sem6000.reset_timer()
        elif cmd == 'request_scheduler':
            response = sem6000.request_scheduler()

            print("Schedulers:")
            for i in range(len(response.scheduler_entries)):
                scheduler_entry = response.scheduler_entries[i]
                scheduler = scheduler_entry.scheduler

                print("\t#" + str(scheduler_entry.slot_id))

                if scheduler.is_active:
                    print("\tActive:\t\t\tOn")
                else:
                    print("\tActive:\t\t\tOff")

                if scheduler.is_action_turn_on:
                    print("\tAction:\t\t\tTurn On")
                else:
                    print("\tAction:\t\t\tTurn Off")

                dt = datetime.datetime.fromisoformat(scheduler.isodatetime)
                if scheduler.repeat_on_weekdays:
                    weekday_formatter = lambda w: w.name
                    repeat_on_weekdays = util._format_list_of_objects(weekday_formatter, scheduler.repeat_on_weekdays)
                    print("\tRepeat on weekdays:\t" + repeat_on_weekdays)
                else:
                    date = dt.date()
                    print("\tDate:\t\t\t" + str(date))

                print("\tTime:\t\t\t" + dt.time().isoformat(timespec='minutes'))
                print("")
        elif cmd == 'add_onetime_scheduler':
            is_active = sys.argv[4]
            is_action_turn_on = sys.argv[5]
            isodatetime = sys.argv[6]

            response = sem6000.add_onetime_scheduler(is_active=is_active, is_action_turn_on=is_action_turn_on, isodatetime=isodatetime)
        elif cmd == 'edit_onetime_scheduler':
            slot_id = sys.argv[4]
            is_active = sys.argv[5]
            is_action_turn_on = sys.argv[6]
            isodatetime = sys.argv[7]

            response = sem6000.edit_onetime_scheduler(slot_id=slot_id, is_active=is_active, is_action_turn_on=is_action_turn_on, isodatetime=isodatetime)
        elif cmd == 'add_repeated_scheduler':
            is_active = sys.argv[4]
            is_action_turn_on = sys.argv[5]
            repeat_on_weekdays=sys.argv[6]
            isotime = sys.argv[7]

            response = sem6000.add_repeated_scheduler(is_active=is_active, is_action_turn_on=is_action_turn_on, repeat_on_weekdays=repeat_on_weekdays, isotime=isotime)
        elif cmd == 'edit_repeated_scheduler':
            slot_id = sys.argv[4]
            is_active = sys.argv[5]
            is_action_turn_on = sys.argv[6]
            repeat_on_weekdays=sys.argv[7]
            isotime = sys.argv[8]

            response = sem6000.edit_repeated_scheduler(slot_id=slot_id, is_active=is_active, is_action_turn_on=is_action_turn_on, repeat_on_weekdays=repeat_on_weekdays, isotime=isotime)
        elif cmd == 'remove_scheduler':
            slot_id = sys.argv[4]

            sem6000.remove_scheduler(slot_id=slot_id)
        elif cmd == 'request_random_mode_status':
            response = sem6000.request_random_mode_status()

            print("Random mode status:")
            if response.is_active:
                print("\tActive:\t\t\tOn")
            else:
                print("\tActive:\t\t\tOff")

            weekday_formatter = lambda w: w.name
            active_on_weekdays = util._format_list_of_objects(weekday_formatter, response.active_on_weekdays)

            start_time = response.start_isotime
            end_time = response.end_isotime

            print("\tActive on weekdays:\t" + active_on_weekdays)
            print("\tStart time:\t\t" + str(start_time))
            print("\tEnd time:\t\t" + str(end_time))
            print("")
        elif cmd == 'change_random_mode':
            active_on_weekdays = sys.argv[4]
            start_isotime = sys.argv[5]
            end_isotime = sys.argv[6]

            sem6000.change_random_mode(active_on_weekdays=active_on_weekdays, start_isotime=start_isotime, end_isotime=end_isotime)
        elif cmd == 'reset_random_mode':
            sem6000.reset_random_mode()
        elif cmd == 'request_measurement':
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
        elif cmd == 'request_consumptions_of_last_12_months':
            response = sem6000.request_consumption_of_last_12_months()
            now = datetime.datetime.now()

            print("Consumptions of last 12 months")
            for i in range(len(response.consumption_n_months_ago_in_watt_hour)):
                if response.consumption_n_months_ago_in_watt_hour[i] is None:
                    continue

                year = now.year
                month = now.month - i 
                if month < 1:
                    month += 12
                    year -= 1

                print("\t" + util._format_year_and_month(year, month) + ":\t" + str(response.consumption_n_months_ago_in_watt_hour[i]) + " Wh")
        elif cmd == 'request_consumptions_of_last_30_days':
            response = sem6000.request_consumption_of_last_30_days()
            now = datetime.datetime.now().date()

            print("Consumptions of last 12 months")
            for i in range(len(response.consumption_n_days_ago_in_watt_hour)):
                if response.consumption_n_days_ago_in_watt_hour[i] is None:
                    continue

                d = now - datetime.timedelta(i)
                print("\t" + d.isoformat() + ":\t" + str(response.consumption_n_days_ago_in_watt_hour[i]) + " Wh")
        elif cmd == 'request_consumptions_of_last_23_hours':
            response = sem6000.request_consumption_of_last_23_hours()
            now = datetime.datetime.now().time()

            print("Consumptions of last 23 hours")
            for i in range(len(response.consumption_n_hours_ago_in_watt_hour)):
                if response.consumption_n_hours_ago_in_watt_hour[i] is None:
                    continue

                hour = now.hour - i
                if hour < 0:
                    hour += 24

                isotime = datetime.time(hour, 0).isoformat(timespec='minutes')

                print("\t" + isotime + ":\t" + str(response.consumption_n_hours_ago_in_watt_hour[i]) + " Wh")
        elif cmd == 'reset_consumption':
            sem6000.reset_consumption()
        elif cmd == 'request_device_name':
            response = sem6000.request_device_name()

            print("Device-Name:\t" + response.device_name)
        elif cmd == 'change_device_name':
            new_name = sys.argv[4]

            sem6000.change_device_name(new_name=new_name)
        elif cmd == 'factory_reset':
            sem6000.factory_reset()
        elif cmd == 'request_device_serial':
            response = sem6000.request_device_serial()

            print("Device-Serial:\t" + str(response.serial))
        else:
            print("Invalid/unknown command: " + cmd, file=sys.stderr)
