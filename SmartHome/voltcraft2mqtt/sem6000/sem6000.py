import binascii
import datetime
import sys

from .bluetooth_lowenergy_interface.bluepy_interface import *
from . import encoder
from .message import *
from . import parser
from .repeat_on_failure_decorator import RepeatOnFailureDecorator
from . import util


class SEM6000Delegate():
    def __init__(self, debug=False, hardware_version=None):
        self.debug = False
        if debug:
            self.debug = True

        self.hardware_version = hardware_version
        self._raw_notifications = []

        self._parser = parser.MessageParser(hardware_version=self.hardware_version)

    def __call__(self, characteristic_uuid, data):
        self._handle_notification(characteristic_uuid, data)

    def _handle_notification(self, characteristic_uuid, data):
        self._raw_notifications.append(data)

    def has_final_raw_notification(self):
        if len(self._raw_notifications) == 0:
            return False

        last_notification = self._raw_notifications[-1]

        if len(last_notification) < 2:
            return False

        # command b'\x04\x00' lacks suffix b'\xff\xff'
        if last_notification[2:4] == b'\x04\x00':
            return True

        # in hardware version >= 3 message b'\x10\x00' (SettingsRequestedNotification)
        # has two extra bytes behind b'\xff\xff'
        if self.hardware_version >= 3 and last_notification[2:4] == b'\x10\x00':
            return last_notification[-4:] == b'\xff\xff\x00\x00'

        return ( last_notification[-2:] == b'\xff\xff' )

    def consume_notification(self):
        exception = None
        notification = None

        data = b''
        for n in self._raw_notifications:
            data += n

        try:
            if not self.has_final_raw_notification():
                raise Exception("Incomplete notification data")

            notification = self._parser.parse(data)
        except Exception as e:
            if self.debug:
                print("received data: " + str(binascii.hexlify(data)) + " (Unknown Notification)", file=sys.stderr)
            raise e

        if self.debug:
            print("received data: " + str(binascii.hexlify(data)) + " (" + str(notification) + ")", file=sys.stderr)


        while len(self._raw_notifications):
            self._raw_notifications.pop(0)

        return notification

    def reset_notification_data(self):
        self._raw_notifications.clear()


class SEM6000():
    SERVICECLASS_UUID='0000fff0-0000-1000-8000-00805f9b34fb'
    CHARACTERISTIC_UUID_NAME='00002a00-0000-1000-8000-00805f9b34fb'
    CHARACTERISTIC_UUID_CONTROL='0000fff3-0000-1000-8000-00805f9b34fb'
    CHARACTERISTIC_UUID_RESPONSE='0000fff4-0000-1000-8000-00805f9b34fb'
    CHARACTERISTIC_UUID_VERSION='0000fff1-0000-1000-8000-00805f9b34fb'

    def __init__(self, deviceAddr=None, pin=None, bluetooth_device='hci0', timeout=5, debug=False):
        """ Create a new SEM6000() instance
        
            Parameters:
                deviceAddr          - Optional, MAC address of a remote device to connect to immediately, i.e. '00:11:22:33:44:55'.
                pin                 - Optional, 4 digit numeric pin, i.e. '0000'.
                bluetooth_device    - Optional, bluetooth device name to use. Default: 'hci0'
                timeout             - Optional, maximum time in seconds to wait for a response from the device. Default: 3
                debug               - Optional, if set to true commands and responses are printed to sys.stderr
        """
        self.timeout = timeout
        self.debug = debug
        self.hardware_version = None

        self.connection_settings = {}

        self.pin = None

        self._encoder = encoder.MessageEncoder()

        self._bluetooth_lowenergy_interface = BluePyBtLeInterface(bluetooth_device=bluetooth_device)

        if not deviceAddr is None:
            self.connect(deviceAddr)

        if not pin is None:
            self.authorize(pin)

    def _disconnect(self):
        if self._bluetooth_lowenergy_interface:
            self._bluetooth_lowenergy_interface.disconnect()

            return True

        return False

    def _reconnect(self):
        self._disconnect()

        if self.debug:
            print("connecting to " + str(self.connection_settings["device_address"]) + " ...", file=sys.stderr)

        try:
            self._bluetooth_lowenergy_interface.connect(self.connection_settings["device_address"])

            # this is necessary since hardware version = 3
            self._bluetooth_lowenergy_interface.set_mtu(160);
        except Exception as e:
            self._disconnect()
            raise e

        #get hardware version  
        device_info = self._bluetooth_lowenergy_interface.read_from_characteristic(self.CHARACTERISTIC_UUID_VERSION)
        self.hardware_version = int(device_info[13])

        if self.debug:
            print("hardware_version: " + str(self.hardware_version), file=sys.stderr)

        # hardware version >= 3 does not support writing to
        # characteristics with confirmation-response
        if self.hardware_version < 3:
            self._bluetooth_lowenergy_interface.enable_notifications()

        self._delegate = SEM6000Delegate(self.debug, hardware_version = self.hardware_version)
        self._bluetooth_lowenergy_interface.add_notification_handler(self._delegate._handle_notification)

        if self.pin:
            try:
                self.authorize(self.pin)
            except Exception as e:
                self._disconnect()
                raise e

    def _is_connected(self):
        if self._bluetooth_lowenergy_interface is None:
            return False

        return self._bluetooth_lowenergy_interface.is_connected()

    def _send_command(self, command):
        encoded_command = self._encoder.encode(command)

        if self.debug:
            print("sent data: " + str(binascii.hexlify(encoded_command)) + " (" + str(command) + ")", file=sys.stderr)

        self._delegate.reset_notification_data()

        if not self._is_connected():
            if self.connection_settings["device_address"] and self.pin:
                self._reconnect()
            else:
                raise Exception("Not connected and no deviceAddress / pin set")

        self._bluetooth_lowenergy_interface.write_to_characteristic(SEM6000.CHARACTERISTIC_UUID_CONTROL, encoded_command)
        self._wait_for_notifications()

    def _wait_for_notifications(self):
        while True:
            if not self._bluetooth_lowenergy_interface.wait_for_notifications(self.timeout):
                break

            if self._delegate.has_final_raw_notification():
                break

    def _consume_notification(self):
        return self._delegate.consume_notification()

    @RepeatOnFailureDecorator()
    def connect(self, device_address):
        """
        Connect to a remote device.

        Parameters:
            device_address  - MAC address to connect to, i.e. '00:11:22:33:44:55'.
        """
        self.connection_settings["device_address"] = device_address

        return self._reconnect()

    def disconnect(self):
        """
        Disconnect from the current remote device.
        """
        return self._disconnect()

    @RepeatOnFailureDecorator()
    def discover(timeout=5, bluetooth_device='hci0'):
        """
        Discover remote devices.

        This method needs special permissions.
        
        Parameters:
            timeout             - Optional, time in seconds to wait for devices to respond. Default: 5
            bluetooth_device    - Optional, bluetooth device name to use. Default: 'hciß'
        """
        bluetooth_lowenergy_interface = BluePyBtLeInterface(bluetooth_device=bluetooth_device)

        return bluetooth_lowenergy_interface.discover(timeout, service_uuids=[SEM6000.SERVICECLASS_UUID])

    @RepeatOnFailureDecorator()
    def request_device_name(self):
        """
        Request the name of the remote device.

        Returns a DeviceNameRequestedNotification.
        """
        data = self._bluetooth_lowenergy_interface.read_from_characteristic(SEM6000.CHARACTERISTIC_UUID_NAME)

        if self.debug:
            print("received data: " + str(binascii.hexlify(data)), file=sys.stderr)

        device_name = data.decode(encoding='utf-8')

        return DeviceNameRequestedNotification(device_name)

    @RepeatOnFailureDecorator()
    def authorize(self, pin):
        """
        Authorize on the connected device.

        Parameters:
            pin - 4 digit PIN, i.e. '0000'

        Returns an AuthorizedNotification.
        """
        command = AuthorizeCommand(pin)
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, AuthorizedNotification):
            raise Exception("Authentication failed")

        if notification.was_successful:
            self.pin = pin
        else:
            self.pin = None
            raise Exception("Authentication failed")

        return notification

    @RepeatOnFailureDecorator()
    def change_pin(self, new_pin):
        """
        Change the pin on the remote device.

        Parameters:
            new_pin - 4 digit PIN to change the current PIN to, i.e. '0000'

        Returns a PinChangedNotification.
        """
        command = ChangePinCommand(self.pin, new_pin)
        self._send_command(command)
        notification = self._consume_notification()

        if self.hardware_version >= 3:
            # hardware version >= 3 does not reply with a PinChangedNotification
            if not isinstance(notification, AuthorizedNotification) or not notification.was_successful:
                raise Exception("Change PIN failed")
        else:
            if not isinstance(notification, PinChangedNotification) or not notification.was_successful:
                raise Exception("Change PIN failed")

        return notification

    @RepeatOnFailureDecorator()
    def reset_pin(self):
        """
        Reset the pin to 0000 on the remote device.

        Returns a PinResetNotification.
        """
        command = ResetPinCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, PinResetNotification) or not notification.was_successful:
            raise Exception("Reset PIN failed")

        return notification

    @RepeatOnFailureDecorator()
    def power_on(self):
        """
        Tell the remote device to turn the power on.

        Returns a PowerSwitchedNotification.
        """
        command = PowerSwitchCommand(True)
        self._send_command(command)
        notification = self._consume_notification()
        
        if not isinstance(notification, PowerSwitchedNotification) or not notification.was_successful:
            raise Exception("Power on failed")

        return notification

    @RepeatOnFailureDecorator()
    def power_off(self):
        """
        Tell the remote device to turn the power off.

        Returns a PowerSwitchedNotification.
        """
        command = PowerSwitchCommand(False)
        self._send_command(command)
        notification = self._consume_notification()
        
        if not isinstance(notification, PowerSwitchedNotification) or not notification.was_successful:
            raise Exception("Power off failed")

        return notification

    @RepeatOnFailureDecorator()
    def nightmode_on(self):
        """
        Activate nightmode on the remote device.

        Returns a NightmodeChangedNotification.
        """
        command = ChangeNightmodeCommand(True)
        self._send_command(command)
        notification = self._consume_notification()
        
        if self.hardware_version >= 3:
            # hardware version >= 3 for some reason replies with a FactoryResetNotification here
            if not isinstance(notification, FactoryResetNotification) or not notification.was_successful:
                raise Exception("Nightmode on failed")
        else:
            if not isinstance(notification, NightmodeChangedNotification) or not notification.was_successful:
                raise Exception("Nightmode on failed")

        return notification

    @RepeatOnFailureDecorator()
    def nightmode_off(self):
        """
        Disable nightmode on the remote device.

        Returns a NightmodeChangedNotification.
        """
        command = ChangeNightmodeCommand(False)
        self._send_command(command)
        notification = self._consume_notification()

        if self.hardware_version >= 3:
            # hardware version >= 3 for some reason replies with a FactoryResetNotification here
            if not isinstance(notification, FactoryResetNotification) or not notification.was_successful:
                raise Exception("Nightmode off failed")
        else:
            if not isinstance(notification, NightmodeChangedNotification) or not notification.was_successful:
                raise Exception("Nightmode off failed")

        return notification

    @RepeatOnFailureDecorator()
    def change_date_and_time(self, isodatetime):
        """
        Set date and time on the remote device.

        Parameters:
            isodatetime - ISO string representing date and time, i.e. '2020-01-01T10:00'

        Returns a DateAndTimeChangedNotification.
        """
        command = SynchronizeDateAndTimeCommand(isodatetime)
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, DateAndTimeChangedNotification) or not notification.was_successful:
            raise Exception("Set date and time failed")

        return notification

    @RepeatOnFailureDecorator()
    def request_settings(self):
        """
        Request the current settings from the remote device.

        Returns a SettingsRequestedNotification.
        """
        command = RequestSettingsCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, SettingsRequestedNotification):
            raise Exception("Request settings failed")

        return notification

    @RepeatOnFailureDecorator()
    def change_power_limit(self, power_limit_in_watt):
        """
        Set the power limit when the remote device should be automatically turn off.

        Returns a PowerLimitChangedNotification.
        """
        command = ChangePowerLimitCommand(power_limit_in_watt=int(power_limit_in_watt))
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, PowerLimitChangedNotification) or not notification.was_successful:
            raise Exception("Set power limit failed")

        return notification

    @RepeatOnFailureDecorator()
    def change_prices(self, normal_price_in_cent, reduced_period_price_in_cent):
        """
        Set the power prices.

        Parameters:
            normal_price_in_cent            - Power price in cents.
            reduced_period_price_in_cent    - Power price in cents during reduced period.

        Returns a PricesChangedNotification.
        """
        command = ChangePricesCommand(normal_price_in_cent=int(normal_price_in_cent), reduced_period_price_in_cent=int(reduced_period_price_in_cent))
        self._send_command(command)
        notification = self._consume_notification()

        if self.hardware_version >= 3:
            # hardware version >= 3 for some reason replies with a FactoryResetNotification here
            if not isinstance(notification, FactoryResetNotification) or not notification.was_successful:
                raise Exception("Set prices failed")
        else:
            if not isinstance(notification, PricesChangedNotification) or not notification.was_successful:
                raise Exception("Set prices failed")

        return notification

    @RepeatOnFailureDecorator()
    def change_reduced_period(self, is_active, start_isotime, end_isotime):
        """
        Sets start and end time of the reduced period.

        Parameters:
            is_active       - True if reduced prices should be used, False if not.
            start_isotime   - ISO start time of the reduced period, i.e. '10:00'
            end_isotime     - ISO end time of the reduced period, i.e. '20:00'

        Returns a ReducedPeriodChangedNotification.
        """
        command = ChangeReducedPeriodCommand(
            is_active=util._parse_boolean(is_active), 
            start_isotime=start_isotime, 
            end_isotime=end_isotime)

        self._send_command(command)
        notification = self._consume_notification()

        if self.hardware_version >= 3:
            # hardware version >= 3 for some reason replies with a FactoryResetNotification here
            if not isinstance(notification, FactoryResetNotification) or not notification.was_successful:
                raise Exception("Set reduced period failed")
        else:
            if not isinstance(notification, ReducedPeriodChangedNotification) or not notification.was_successful:
                raise Exception("Set reduced period failed")

        return notification

    @RepeatOnFailureDecorator()
    def request_timer_status(self):
        """
        Request the current status of the timer.

        Returns a TimerStatusRequestedNotification.
        """
        command = RequestTimerStatusCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, TimerStatusRequestedNotification):
            raise Exception("Request timer status failed")

        return notification

    @RepeatOnFailureDecorator()
    def activate_timer(self, is_action_turn_on, delay_isotime):
        """
        Activate the timer.

        Parameters:
            is_action_turn_on   - True if the power should be turned on after the delay has passed, False if the power should be turned off.
            delay_isotime       - Delay in iso time format, i.e. '00:00:05' for 5 seconds.

        Returns a TimerSetNotification.
        """
        time = datetime.time.fromisoformat(delay_isotime)
        timedelta = datetime.timedelta(hours=time.hour, minutes=time.minute, seconds=time.second)
        dt = datetime.datetime.now() + timedelta

        command = SetTimerCommand(
            is_reset_timer=False, 
            is_action_turn_on=util._parse_boolean(is_action_turn_on), 
            target_isodatetime=dt.isoformat(timespec='seconds'))

        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, TimerSetNotification) or not notification.was_successful:
            raise Exception("Set timer failed")

        return notification

    @RepeatOnFailureDecorator()
    def activate_timer_at(self, is_action_turn_on, target_isodatetime):
        """
        Activate the timer at the specified date and time.

        Parameters:
            is_action_turn_on   - True if the power should be turned on, False if the power should be turned off.
            target_isodatetime  - iso date and time format, i.e. '2020-01-01T00:00:05'.

        Returns a TimerSetNotification.
        """
        command = SetTimerCommand(
            is_reset_timer=False, 
            is_action_turn_on=util._parse_boolean(is_action_turn_on), 
            target_isodatetime=target_isodatetime)

        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, TimerSetNotification) or not notification.was_successful:
            raise Exception("Set timer failed")

        return notification

    @RepeatOnFailureDecorator()
    def reset_timer(self):
        """
        Stop and reset the timer.

        Returns a TimerSetNotification.
        """
        command = SetTimerCommand(is_reset_timer=True, is_action_turn_on=False)
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, TimerSetNotification) or not notification.was_successful:
            raise Exception("Reset timer failed")

        return notification

    @RepeatOnFailureDecorator()
    def request_scheduler(self):
        """
        Request all currently set schedulers.

        Returns a SchedulerRequestedNotification.
        """
        command = RequestSchedulerCommand(page_number=0)
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, SchedulerRequestedNotification):
            raise Exception('Request scheduler 1st page failed')

        max_page_number = notification.number_of_schedulers // 4
        for page_number in range(1, max_page_number+1):
            command = RequestSchedulerCommand(page_number=page_number)
            self._send_command(command)
            further_notification = self._consume_notification()

            if not isinstance(further_notification, SchedulerRequestedNotification):
                raise Exception('Request scheduler 2nd page failed')

            notification.scheduler_entries.extend(further_notification.scheduler_entries)

        return notification

    @RepeatOnFailureDecorator()
    def add_onetime_scheduler(self, is_active, is_action_turn_on, isodatetime):
        """
        Add a scheduler entry occuring at a specific date and time.

        Parameters:
            is_active           - True if the scheduler entry should be active, else False.
            is_action_turn_on   - True if the power should be turned on, False if the power should be turned off.
            isodatetime         - ISO date and time for when the scheduler entry should be executed, i.e. '2020-01-01T10:00'

        Returns a SchedulerChangedNotification.
        """
        command = AddSchedulerCommand(
            OneTimeScheduler(
                is_active=util._parse_boolean(is_active), 
                is_action_turn_on=util._parse_boolean(is_action_turn_on), 
                isodatetime=isodatetime
            ))

        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, SchedulerChangedNotification) or not notification.was_successful:
            raise Exception("Add scheduler failed")

        return notification

    @RepeatOnFailureDecorator()
    def edit_onetime_scheduler(self, slot_id, is_active, is_action_turn_on, isodatetime):
        """
        Edit an existing scheduler entry occuring at a specific date and time.

        Parameters:
            slot_id             - id of the slot where the scheduler entry is currently stored at.
            is_active           - True if the scheduler entry should be active, else False.
            is_action_turn_on   - True if the power should be turned on, False if the power should be turned off.
            isodatetime         - ISO date and time for when the scheduler entry should be executed, i.e. '2020-01-01T10:00'

        Returns a SchedulerChangedNotification.
        """
        command = EditSchedulerCommand(
            slot_id=int(slot_id), 
            scheduler=OneTimeScheduler(
                is_active=util._parse_boolean(is_active), 
                is_action_turn_on=util._parse_boolean(is_action_turn_on), 
                isodatetime=isodatetime
            ))

        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, SchedulerChangedNotification) or not notification.was_successful:
            raise Exception("Edit scheduler failed")

        return notification

    @RepeatOnFailureDecorator()
    def add_repeated_scheduler(self, is_active, is_action_turn_on, repeat_on_weekdays, isotime):
        """
        Add a scheduler entry that will be repeated regulary.

        Parameters:
            is_active           - True if the scheduler entry should be active, else False.
            is_action_turn_on   - True if the power should be turned on, False if the power should be turned off.
            repeat_on_weekdays  - Comma separated list of Weekdays the scheduler should be repeated on, i.e. 'Mon,Wed,Fri'
            isotime             - ISO time for when the scheduler entry should be executed, i.e. '10:00'

        Returns a SchedulerChangedNotification.
        """
        command = AddSchedulerCommand(
            RepeatedScheduler(
                is_active=util._parse_boolean(is_active), 
                is_action_turn_on=util._parse_boolean(is_action_turn_on), 
                repeat_on_weekdays=util._parse_weekdays_list(repeat_on_weekdays), 
                isotime=isotime
            ))

        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, SchedulerChangedNotification) or not notification.was_successful:
            raise Exception("Add scheduler failed")

        return notification

    @RepeatOnFailureDecorator()
    def edit_repeated_scheduler(self, slot_id, is_active, is_action_turn_on, repeat_on_weekdays, isotime):
        """
        Edit an existing scheduler entry that will be repeated regulary.

        Parameters:
            slot_id             - id of the slot where the scheduler entry is currently stored at.
            is_active           - True if the scheduler entry should be active, else False.
            is_action_turn_on   - True if the power should be turned on, False if the power should be turned off.
            repeat_on_weekdays  - Comma separated list of Weekdays the scheduler should be repeated on, i.e. 'Mon,Wed,Fri'
            isotime             - ISO time for when the scheduler entry should be executed, i.e. '10:00'

        Returns a SchedulerChangedNotification.
        """
        command = EditSchedulerCommand(
            slot_id=int(slot_id), 
            scheduler=RepeatedScheduler(
                is_active=util._parse_boolean(is_active), 
                is_action_turn_on=util._parse_boolean(is_action_turn_on), 
                repeat_on_weekdays=util._parse_weekdays_list(repeat_on_weekdays), 
                isotime=isotime
            ))

        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, SchedulerChangedNotification) or not notification.was_successful:
            raise Exception("Edit scheduler failed")

        return notification

    @RepeatOnFailureDecorator()
    def remove_scheduler(self, slot_id):
        """
        Remove an existing scheduler entry.

        Parameters:
            slot_id             - id of the slot where the scheduler entry is currently stored at.

        Returns a SchedulerChangedNotification.
        """
        command = RemoveSchedulerCommand(slot_id=int(slot_id))
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, SchedulerChangedNotification) or not notification.was_successful:
            raise Exception("Remove scheduler failed")

        return notification

    @RepeatOnFailureDecorator()
    def request_random_mode_status(self):
        """
        Request the current status of the random mode from the remote device.

        Returns a RandomModeStatusRequestedNotification.
        """
        command = RequestRandomModeStatusCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, RandomModeStatusRequestedNotification):
            raise Exception("Request random mode status failed")

        return notification

    @RepeatOnFailureDecorator()
    def change_random_mode(self, active_on_weekdays, start_isotime, end_isotime):
        """
        Activate random mode on the remote device.

        Parameters:
            active_on_weekdays  - Comma separated list of Weekdays the scheduler should be repeated on, i.e. 'Mon,Wed,Fri'
            start_isotime       - ISO time of when random mode should start, i.e. '10:00'
            end_isotime         - ISO time of when random mode should stop, i.e. '20:00'

        Returns a RandomModeChangedNotification.
        """
        command = ChangeRandomModeCommand(
            is_active=True, 
            active_on_weekdays=util._parse_weekdays_list(active_on_weekdays), 
            start_isotime=start_isotime, 
            end_isotime=end_isotime)

        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, RandomModeChangedNotification) or not notification.was_successful:
            raise Exception("Set random mode failed")

        return notification

    @RepeatOnFailureDecorator()
    def reset_random_mode(self):
        """
        Disable random mode on the remote device.

        Returns a RandomModeChangedNotification.
        """
        command = ChangeRandomModeCommand(
            is_active=False, 
            active_on_weekdays=[], 
            start_isotime="00:00", 
            end_isotime="00:00")

        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, RandomModeChangedNotification) or not notification.was_successful:
            raise Exception("Set random mode failed")

        return notification

    @RepeatOnFailureDecorator()
    def request_measurement(self):
        """
        Request current measurement values.

        Returns a MeasurementRequestedNotification.
        """
        command = RequestMeasurementCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, MeasurementRequestedNotification):
            raise Exception("Request measurement failed")

        return notification

    @RepeatOnFailureDecorator()
    def request_consumption_of_last_12_months(self):
        """
        Request consumption values of last 12 months.

        Date and time need to be set for the device to start collecting these data.

        Returns a ConsumptionOfLast12MonthsRequestedNotification.
        """
        command = RequestConsumptionOfLast12MonthsCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, ConsumptionOfLast12MonthsRequestedNotification):
            raise("Request consumption of last 12 months failed")

        return notification

    @RepeatOnFailureDecorator()
    def request_consumption_of_last_30_days(self):
        """
        Request consumption values of last 30 days.

        Date and time need to be set for the device to start collecting these data.

        Returns a ConsumptionOfLast30DaysRequestedNotification.
        """
        command = RequestConsumptionOfLast30DaysCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, ConsumptionOfLast30DaysRequestedNotification):
            raise("Request consumption of last 30 days failed")

        return notification

    @RepeatOnFailureDecorator()
    def request_consumption_of_last_23_hours(self):
        """
        Request consumption values of curent hour and last 23 hours.

        Date and time need to be set for the device to start collecting these data.

        Returns a ConsumptionOfLast23HoursRequestedNotification.
        """
        command = RequestConsumptionOfLast23HoursCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, ConsumptionOfLast23HoursRequestedNotification):
            raise("Request consumption of last 23 hours failed")

        return notification

    @RepeatOnFailureDecorator()
    def reset_consumption(self):
        """
        Reset consumption data.

        Returns a ResetConsumptionNoticiation.
        """
        command = ResetConsumptionCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, ConsumptionResetNotification) or not notification.was_successful:
            raise("Reset consumption failed")

        return notification

    @RepeatOnFailureDecorator()
    def factory_reset(self):
        """
        Reset the remote device to factory state.

        Returns a FactoryResetNotification.
        """
        command = FactoryResetCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, FactoryResetNotification) or not notification.was_successful:
            raise("Factory reset failed")

        return notification

    @RepeatOnFailureDecorator()
    def change_device_name(self, new_name):
        """
        Set the name of the remote device.

        Parameters:
            new_name    - Name to be set.

        Returns a DeviceNameChangedNotification.
        """
        command = ChangeDeviceNameCommand(new_name=new_name)
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, DeviceNameChangedNotification) or not notification.was_successful:
            raise Exception("Set device name failed")

        return notification

    @RepeatOnFailureDecorator()
    def request_device_serial(self):
        """
        Request the serial number of the remote device.

        Returns a DeviceSerialRequestedNotification.
        """
        if self.hardware_version >= 3:
            raise Exception("Devices with hardware version newer or equal 3 do not support to query the serial number")

        command = RequestDeviceSerialCommand()
        self._send_command(command)
        notification = self._consume_notification()

        if not isinstance(notification, DeviceSerialRequestedNotification):
            raise Exception("Request device serial failed")

        return notification
