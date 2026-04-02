/* eslint-disable @typescript-eslint/restrict-plus-operands */
import bunyan from "bunyan";
import fs from "fs";
import { simpleParser } from "mailparser";
import mqtt from "mqtt";
import { SMTPServer } from "smtp-server";

function parsedMailInfoSerializer(parsedMailInfo: { from: string; messageId: string; }) {
   return {
      from: parsedMailInfo.from,
      messageId: parsedMailInfo.messageId,
   };
}

function sessionInfoSerializer(sessionInfo: { clientHostname: string; id: string; remoteAddress: string; transaction: string; }) {
   return {
      clientHostname: sessionInfo.clientHostname,
      id: sessionInfo.id,
      remoteAddress: sessionInfo.remoteAddress,
      transaction: sessionInfo.transaction,
   };
}

const logger = bunyan.createLogger({
   level: "debug",
   name: "smtp2mqtt",
   serializers: {
      parsedMailInfo: parsedMailInfoSerializer,
      sessionInfo: sessionInfoSerializer, 
   },
});

const smtpStorage = "/storage";
const smtpServerPort = 2525;
const smtpUserName = "pi@fleishor.localdomain";
const smtpPassword = "pi";
const mqttBroker = "mqtt://docker.fritz.box";
const mqttClientId = "smtp2mqtt";

// Connect to MQTT Broker
let mqttClientConnected = false;
const mqttClient = mqtt.connect(mqttBroker, { clientId: mqttClientId });

const smtpServer = new SMTPServer({
   // Disable STARTTLS to allow authentication in clear text mode
   disabledCommands: ["STARTTLS"],
   logger: logger,
   onAuth(auth, session, callback) {
      logger.info({ sessionInfo: session }, "SMTPServer.onAuth");
      if (auth.username !== smtpUserName && auth.password !== smtpPassword) {
         callback(new Error("Invalid username/password:" + auth.username + "/" + auth.password));
      }
      callback(null, { user: 123456 }); // where 123 is the user id or similar property
   },
   onClose(session) {
      logger.info({ sessionInfo: session }, "SMTPServer.onClose from " + session.clientHostname);
   },
   onConnect(session, callback) {
      logger.info({ sessionInfo: session }, "SMTPServer.onConnect from " + session.clientHostname);
      callback();
   },
   onData(stream, session, callback) {
      // Receive email
      logger.info({ sessionInfo: session }, "SMTPServer.onData from " + session.clientHostname);
      simpleParser(stream, {}, (err, parsedMail) => {
         // Parse email
         logger.info({ parsedMailInfo: parsedMail, sessionInfo: session }, "SMTPServer.onData.simpleParser: start");
         if (err) {
            logger.error({ sessionInfo: session }, "SMTPServer.onData.simpleParser: " + err);
         }

         logger.info({ parsedMailInfo: parsedMail, sessionInfo: session }, "SMTPServer.onData.simpleParser: parsed email with subject: " + parsedMail.subject);

         // Parsed mail without attachments
         const parsedMailWithoutAttachments = Object.assign({}, parsedMail);
         parsedMailWithoutAttachments.attachments = [];
         parsedMailWithoutAttachments.html = parsedMailWithoutAttachments.html || ( parsedMailWithoutAttachments.textAsHtml ?? false );

         // Create directory for writing mail
         logger.info({ parsedMailInfo: parsedMail, sessionInfo: session }, "SMTPServer.onData.simpleParser: make directory for session.id" + session.id);
         const dateNowUtc = new Date().toISOString();
         const mailDirectory = dateNowUtc + "_" + session.id;
         fs.mkdirSync(mailDirectory);

         // Write email as JSON
         logger.info({ parsedMailInfo: parsedMail, sessionInfo: session }, "SMTPServer.onData.simpleParser: write JSON file");
         fs.writeFileSync(mailDirectory + "/" + session.id + ".json", JSON.stringify(parsedMailWithoutAttachments));

         // Write eamil as HTML
         logger.info({ parsedMailInfo: parsedMail, sessionInfo: session }, "SMTPServer.onData.simpleParser: write HTML file");
         fs.writeFileSync(mailDirectory + "/" + session.id + ".html", parsedMailWithoutAttachments.html === false ? "" : parsedMailWithoutAttachments.html);

         // Write Attachments
         parsedMail.attachments.forEach((attachment) => {
            logger.info({ parsedMailInfo: parsedMail, sessionInfo: session }, "SMTPServer.onData.simpleParser: write attachment: " + attachment.filename);
            fs.writeFileSync(mailDirectory + "/" + attachment.filename, attachment.content);
         });

         // Publish sessionId via MQTT
         if (mqttClientConnected) {
            const mqttPrefix = "smtp";
            let mqttDevice = "UnknownDevice";
            if (!parsedMail.from) {
               logger.warn({ parsedMailInfo: parsedMail, sessionInfo: session }, "Email has no 'from' address");
            }
            else 
            {
               mqttDevice = parsedMail.from.value["0"].name;
            }
            if (!mqttDevice) {
               mqttDevice = session.clientHostname.replace(".fritz.box", "");
            }

            let mqttSubDevice = mqttDevice;
            const mailSubject = parsedMailWithoutAttachments.subject ?? "No Subject";
            if (mailSubject.includes("OpenMediaVault")) {
               mqttSubDevice = "OpenMediaVault";
            } else if (mailSubject.includes("Buero")) {
               mqttSubDevice = "Buero";
            } else if (mailSubject.includes("Gefriertruhe")) {
               mqttSubDevice = "Gefriertruhe";
            } else if (mailSubject.includes("Kueche")) {
               mqttSubDevice = "Kueche";
            } else if (mailSubject.includes("Wintergarten")) {
               mqttSubDevice = "Wintergarten";
            }

            const topic = mqttPrefix + "/" + mqttDevice + "/" + mqttSubDevice;
            const mqttPayload = JSON.stringify({
               clientHostname: session.clientHostname,
               mailDirectory: mailDirectory,
               mqttDevice: mqttDevice,
               mqttPrefix: mqttPrefix,
               mqttSubDevice: mqttSubDevice,
               sessionId: session.id,
               topic: topic,
            });
            logger.info({ mqttPayload: mqttPayload, topic: topic }, "Publish to MQTT with topic " + topic);
            mqttClient.publish(topic, mqttPayload);
         }

         logger.info({ parsedMailInfo: parsedMail, sessionInfo: session }, "SMTPServer.onData.simpleParser: done");
         callback();
      });

      logger.info({ sessionInfo: session }, "SMTPServer.onData: done");
   },
});

smtpServer.on("error", (err) => {
   logger.error("Error %s", err.message);
});

process.chdir(smtpStorage);

mqttClient.on("connect", () => {
   mqttClientConnected = true;
   logger.info("Connected to MQTT Broker");
});

mqttClient.on("error", function (error) {
   logger.error("Error connecting to MQTT Broker, Error:" + error);
   process.exit(1);
});

logger.info({}, "Startup SMTP Server");
smtpServer.listen(smtpServerPort, "0.0.0.0");
