import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import mqtt from "mqtt";
import fs from "fs";
import bunyan from "bunyan";

function sessionInfoSerializer(sessionInfo) {
   return {
      id: sessionInfo.id,
      remoteAddress: sessionInfo.remoteAddress,
      clientHostname: sessionInfo.clientHostname,
      transaction: sessionInfo.transaction,
   };
}

function parsedMailInfoSerializer(parsedMailInfo) {
   return {
      messageId: parsedMailInfo.messageId,
      from: parsedMailInfo.from,
   };
}

const logger = bunyan.createLogger({
   name: "smtp2mqtt",
   level: "debug",
   serializers: {
      sessionInfo: sessionInfoSerializer,
      parsedMailInfo: parsedMailInfoSerializer,
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
   onConnect(session, callback) {
      logger.info({ sessionInfo: session }, "SMTPServer.onConnect from " + session.clientHostname);
      return callback();
   },
   onClose(session) {
      logger.info({ sessionInfo: session }, "SMTPServer.onClose from " + session.clientHostname);
   },
   onData(stream, session, callback) {
      // Receive email
      logger.info({ sessionInfo: session }, "SMTPServer.onData from " + session.clientHostname);
      simpleParser(stream, {}, (err, parsedMail) => {
         // Parse email
         logger.info({ sessionInfo: session, parsedMailInfo: parsedMail }, "SMTPServer.onData.simpleParser: start");
         if (err) {
            logger.error({ sessionInfo: session }, "SMTPServer.onData.simpleParser: " + err);
         }

         logger.info({ sessionInfo: session, parsedMailInfo: parsedMail }, "SMTPServer.onData.simpleParser: parsed email with subject: " + parsedMail.subject);

         // Parsed mail without attachments
         const parsedMailWithoutAttachments = Object.assign({}, parsedMail);
         delete parsedMailWithoutAttachments.attachments;
         parsedMailWithoutAttachments.clientHostname = session.clientHostname;
         if (!parsedMailWithoutAttachments.html) {
            logger.info({ sessionInfo: session, parsedMailInfo: parsedMail }, "SMTPServer.onData.simpleParser: replace html with textAsHtml");
            parsedMailWithoutAttachments.html = parsedMailWithoutAttachments.textAsHtml;
         }

         // Create directory for writing mail
         logger.info({ sessionInfo: session, parsedMailInfo: parsedMail }, "SMTPServer.onData.simpleParser: make directory for session.id" + session.id);
         const dateNowUtc = new Date().toISOString();
         const mailDirectory = dateNowUtc + "_" + session.id;
         fs.mkdirSync(mailDirectory);

         // Write email as JSON
         logger.info({ sessionInfo: session, parsedMailInfo: parsedMail }, "SMTPServer.onData.simpleParser: write JSON file");
         fs.writeFileSync(mailDirectory + "/" + session.id + ".json", JSON.stringify(parsedMailWithoutAttachments));

         // Write eamil as HTML
         logger.info({ sessionInfo: session, parsedMailInfo: parsedMail }, "SMTPServer.onData.simpleParser: write HTML file");
         fs.writeFileSync(mailDirectory + "/" + session.id + ".html", parsedMailWithoutAttachments.html);

         // Write Attachments
         parsedMail.attachments.forEach((attachment) => {
            logger.info({ sessionInfo: session, parsedMailInfo: parsedMail }, "SMTPServer.onData.simpleParser: write attachment: " + attachment.filename);
            fs.writeFileSync(mailDirectory + "/" + attachment.filename, attachment.content);
         });

         // Publish sessionId via MQTT
         if (mqttClientConnected) {
            const mqttPrefix = "smtp2mqtt";
            let mqttDevice = parsedMail.from.value["0"].name;
            if (!mqttDevice) {
               mqttDevice = session.clientHostname.replace(".fritz.box", "");
            }

            let mqttSubDevice = mqttDevice;
            if (parsedMailWithoutAttachments.subject.indexOf("OpenMediaVault") != -1) {
               mqttSubDevice = "OpenMediaVault";
            } else if (parsedMailWithoutAttachments.subject.indexOf("Buero") != -1) {
               mqttSubDevice = "Buero";
            } else if (parsedMailWithoutAttachments.subject.indexOf("Gefriertruhe") != -1) {
               mqttSubDevice = "Gefriertruhe";
            } else if (parsedMailWithoutAttachments.subject.indexOf("Kueche") != -1) {
               mqttSubDevice = "Kueche";
            } else if (parsedMailWithoutAttachments.subject.indexOf("Wintergarten") != -1) {
               mqttSubDevice = "Wintergarten";
            }

            const topic = "/" + mqttPrefix + "/" + mqttDevice + "/" + mqttSubDevice;
            const mqttPayload = JSON.stringify({
               topic: topic,
               mqttPrefix: mqttPrefix,
               mqttDevice: mqttDevice,
               mqttSubDevice: mqttSubDevice,
               mailDirectory: mailDirectory,
               sessionId: session.id,
               clientHostname: session.clientHostname,
            });
            logger.info({ topic: topic, mqttPayload: mqttPayload }, "Publish to MQTT with topic " + topic);
            mqttClient.publish(topic, mqttPayload);
         }

         logger.info({ sessionInfo: session, parsedMailInfo: parsedMail }, "SMTPServer.onData.simpleParser: done");
         callback();
      });

      logger.info({ sessionInfo: session }, "SMTPServer.onData: done");
   },
   onAuth(auth, session, callback) {
      logger.info({ sessionInfo: session }, "SMTPServer.onAuth");
      if (auth.username !== smtpUserName && auth.password !== smtpPassword) {
         return callback(new Error("Invalid username/password:" + auth.username + "/" + auth.password));
      }
      callback(null, { user: 123456 }); // where 123 is the user id or similar property
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
