import express from "express";
import bodyParser from "body-parser";
import winston from "winston";
import expressWinston from "express-winston";
import { v4 as uuidv4 } from "uuid";
import mqtt from "mqtt";

const expressApp = express();
const expressPort = 3001;
const grafanaRoute = "/Grafana/*";
const mqttBroker = "mqtt://docker.fritz.box";
const mqttClientId = "webhook2mqtt";

let loggerUuid = null;

// Create Logger
const logger = winston.createLogger({
   level: "info",
   format: winston.format.combine(winston.format.timestamp(), winston.format.json(), winston.format.errors({ stack: true })),
   transports: [new winston.transports.Console()],
   exceptionHandlers: [new winston.transports.Console()],
   rejectionHandlers: [new winston.transports.Console()],
   defaultMeta: {
      get uuid() {
         return loggerUuid;
      },
   },
});

const expressLogger = expressWinston.logger({ winstonInstance: logger });
const expressErrorLogger = expressWinston.errorLogger({ winstonInstance: logger });

// Add POST request helper
expressApp.use(expressLogger);
expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(bodyParser.json());
expressApp.use(expressErrorLogger);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
expressApp.use(function (err, req, res, next) {
   res.status(500).send("Internal Error");
});

// Connect to MQTT Broker
let mqttClientConnected = false;
const mqttClient = mqtt.connect(mqttBroker, { clientId: mqttClientId });

// Handle POST request for /Grafana/*
expressApp.post(grafanaRoute, (request, response) => {
   // generate new uuid
   loggerUuid = uuidv4();
   logger.info(`Received POST requst for url "${request.path}"`, {
      request_path: request.path,
      request_body: request.body,
   });
   const grafanaAlert = request.body;

   // forward POST request to MQTT
   if (mqttClientConnected) {
      const mqttPrefix = "webhook2mqtt";
      const mqttWebHook = "Grafana";
      const mqttAlertName = grafanaAlert.commonLabels.alertname;
      const topic = "/" + mqttPrefix + "/" + mqttWebHook + "/" + mqttAlertName;
      const playload = JSON.stringify({
         topic: topic,
         mqttPrefix: mqttPrefix,
         mqttWebHook: mqttWebHook,
         mqttAlertName: mqttAlertName,
         path: request.path,
         payload: request.body,
      });

      logger.info("Publish to MQTT with topic " + topic, { topic: topic, payload: playload });
      mqttClient.publish(topic, playload);
   }
   response.end();
   loggerUuid = null;
});

mqttClient.on("connect", () => {
   mqttClientConnected = true;
   logger.info("Connected to MQTT Broker");
});

mqttClient.on("error", function (error) {
   logger.error("Error connecting to MQTT Broker, Error:" + error);
   process.exit(1);
});

// Start HTTP Server
expressApp.listen(expressPort, () => {
   logger.info(`Express is listening at http://localhost:${expressPort}`);
});
