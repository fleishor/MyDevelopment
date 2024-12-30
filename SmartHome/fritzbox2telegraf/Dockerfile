FROM alpine:latest

#install python3
RUN apk add python3 py3-pip netcat-openbsd sudo busybox-suid

RUN addgroup -g 995 -S fritzbox && \
    adduser -h "/home/fritzbox" -S -G fritzbox -u 1005 fritzbox && \
    echo "fritzbox ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/fritzbox \
        && chmod 0440 /etc/sudoers.d/fritzbox

USER fritzbox

WORKDIR /home/fritzbox

RUN pip3 install fritzconnection ping3 --break-system-packages
COPY --chown=fritzbox:fritzbox ./telegrafFritzBox.4040.py .
COPY --chown=fritzbox:fritzbox ./telegrafFritzBox.7490.py .
COPY --chown=fritzbox:fritzbox ./telegrafFritzBox.SmartHome.py .
COPY --chown=fritzbox:fritzbox ./telegrafFritzBox.sh .
RUN chmod +x ./telegrafFritzBox.sh

# Configure cron
COPY crontab /etc/cron/crontab

# Init cron
RUN crontab /etc/cron/crontab

CMD ["sudo", "-E", "crond", "-f"]
