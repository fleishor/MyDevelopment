import sys
import time

def RepeatOnFailureDecorator(delays_in_seconds=None):
    if delays_in_seconds is None:
        delays_in_seconds = [0.1, 0.2, 0.4, 1.6, 3.2, 6.4]

    def Decorator(function):
        def decorated_function(*s, **d):
            def reconnect():
                reconnectable = s[0]
                reconnectable._reconnect()

            def debug(msg):
                debuggable = s[0]

                if debuggable.debug:
                    print(msg, file=sys.stderr)

            tries = 0
            for delay_in_seconds in delays_in_seconds:
                try:
                    return function(*s, **d)
                except Exception as e:
                    if tries == len(delays_in_seconds)-1:
                        debug("command failed after " + str(tries) + " retries")

                        raise e

                debug("command failed (" + str(tries) + " retries) - repeating after " + str(delay_in_seconds) + " seconds...")

                tries += 1
                time.sleep(delay_in_seconds)
                reconnect()

        return decorated_function

    return Decorator
