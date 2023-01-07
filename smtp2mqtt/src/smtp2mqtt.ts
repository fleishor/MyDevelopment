const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
import mqtt from "mqtt";
import fs from "fs";
import bunyan from "bunyan";

function mapToObj(inputMap) {
   let obj = {};

   inputMap.forEach(function(value, key){
       obj[key] = value
   });

   return obj;
}

function sessionInfoSerializer(sessionInfo) {
   return {
      id: sessionInfo.id,
      remoteAddress : sessionInfo.remoteAddress,
      clientHostname : sessionInfo.clientHostname,
      transaction : sessionInfo.transaction
   };
}

function parsedMailInfoSerializer(parsedMailInfo) {
   return {
      messageId: parsedMailInfo.messageId,
      from: parsedMailInfo.from,
   };
}

var logger = bunyan.createLogger({
   name: "smtp2mqtt", 
   level: "debug",
   serializers: {
      sessionInfo: sessionInfoSerializer,
      parsedMailInfo: parsedMailInfoSerializer
   }
});

const smtpStorage = "/storage"
const smtpServerPort = 2525;
const smtpUserName = "pi@fleishor.localdomain";
const smtpPassword = "pi";
const mqttBroker = "mqtt://docker.fritz.box";
const mqttClientId = "smtp2mqtt";

// Connect to MQTT Broker
let mqttClientConnected = false;
const mqttClient = mqtt.connect(mqttBroker, { clientId: mqttClientId });

const smtpServer = new SMTPServer({
   // disable STARTTLS to allow authentication in clear text mode
   disabledCommands: ["STARTTLS"],
   logger: logger,
   onConnect(session, callback) {
      logger.info({sessionInfo: session}, "SMTPServer.onConnect from " + session.clientHostname);
      return callback();
   },
   onClose(session) {
      logger.info({sessionInfo: session}, "SMTPServer.onClose from " + session.clientHostname);
   },
   onData(stream, session, callback) {
      logger.info({sessionInfo: session}, "SMTPServer.onData from " + session.clientHostname);
      simpleParser(stream, {}, (err, parsedMail) => {
         logger.info({sessionInfo: session, parsedMailInfo: parsedMail}, "SMTPServer.onData.simpleParser: start");
         if (err)
         {
            logger.error({sessionInfo: session}, "SMTPServer.onData.simpleParser: " + err);
         }

         logger.info({sessionInfo: session, parsedMailInfo: parsedMail}, "SMTPServer.onData.simpleParser: parsed email with subject: " + parsedMail.subject);

         var parsedWithoutAttachments = Object.assign({}, parsedMail);;
         delete parsedWithoutAttachments.attachments;
         parsedWithoutAttachments.headers = mapToObj(parsedMail.headers);
         if (!parsedWithoutAttachments.html)
         {
            logger.info({sessionInfo: session, parsedMailInfo: parsedMail}, "SMTPServer.onData.simpleParser: replace html with testAsHtml");
            parsedWithoutAttachments.html = parsedWithoutAttachments.textAsHtml;
         }
         logger.info({sessionInfo: session, parsedMailInfo: parsedMail}, "SMTPServer.onData.simpleParser: make directory for session.id" + session.id);
         fs.mkdirSync(session.id);

         logger.info({sessionInfo: session, parsedMailInfo: parsedMail}, "SMTPServer.onData.simpleParser: write JSON file");
         fs.writeFileSync(session.id + "/" + session.id + ".json", JSON.stringify(parsedWithoutAttachments));

         logger.info({sessionInfo: session, parsedMailInfo: parsedMail}, "SMTPServer.onData.simpleParser: write HTML file");
         fs.writeFileSync(session.id + "/" + session.id + ".html", parsedWithoutAttachments.html);

         parsedMail.attachments.forEach(attachment => {
            logger.info({sessionInfo: session, parsedMailInfo: parsedMail}, "SMTPServer.onData.simpleParser: write attachment: " + attachment.filename);
            fs.writeFileSync(session.id + "/" + attachment.filename, attachment.content);
         });

         // publish sessionId via MQTT
         if (mqttClientConnected) {
            let topic = "/" + session.clientHostname;
            let playload = JSON.stringify({topic: topic, sessionId: session.id});
            logger.info({topic: topic, payload: playload }, "Publish to MQTT with topic " + topic);
            mqttClient.publish(topic, JSON.stringify(playload));
         }

         logger.info({sessionInfo: session, parsedMailInfo: parsedMail}, "SMTPServer.onData.simpleParser: done");
         callback();
      });

      logger.info({sessionInfo: session}, "SMTPServer.onData: done");
   },
   onAuth(auth, session, callback) {
      logger.info({sessionInfo: session}, "SMTPServer.onAuth");
      if (auth.username !== smtpUserName && auth.password !== smtpPassword) {
         return callback(new Error("Invalid username/password:" + auth.username + "/" + auth.password));
      }
      callback(null, { user: 123456 }); // where 123 is the user id or similar property
   }
});

smtpServer.on("error", err => {
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

