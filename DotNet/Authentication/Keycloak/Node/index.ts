// src/index.ts
import express from "express";
import session from "express-session";
import { jwtDecode } from "jwt-decode";
import { MemoryStore } from 'express-session';
import KeycloakConnect from 'keycloak-connect';
import morgan from "morgan";

declare module 'express-session' {
   interface SessionData {
      "keycloak-token": any;
   }
 }

 KeycloakConnect.prototype.redirectToLogin = function(req: any) {
   const apiReqMatcher = /\/api\//i;
   return !apiReqMatcher.test(req.originalUrl || req.url);
   };

const app = express();
const port = 3001;
const memoryStore = new MemoryStore();
const keycloak = new KeycloakConnect({ 
      store: memoryStore, 
      scope : "phone"
   }, './keycloak.json');


// Middleware für Logging hinzufügen
app.use(morgan(":status :method :url Redirected to: :res[location]"));

// Session-Management konfigurieren
app.use(
   session({
      secret: "thisShouldBeLongAndSecret",
      resave: false,
      saveUninitialized: true,
      store: memoryStore,
   })
);

// Keycloak-Middleware hinzufügen
app.use(keycloak.middleware());

// Home
app.get("/", (req, res) => {
   res.redirect("/showSessionInfo");
});

// Anzeigen von Session-Informationen
app.get("/showSessionInfo",(req, res) => {
   var response = generateSessionInfoHtml(req);
   res.send(response);
});

// Login-Endpunkt
app.get("/login", keycloak.protect(), (req, res) => {
   const iss = req.query.iss;
   if (iss) {
      var response = generateSessionInfoHtml(req);
      res.send(response);
   } else {
      res.send("This is a path is protected by Keycloak.");
   }
});
 
// Logout-Endpunkt
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to logout.');
    }
    var response = generateSessionInfoHtml(req);
    res.send(response);
   });
});

// Gesicherte Route mit Bearer-Token-Authentifizierung
app.get("/api/secure", keycloak.protect(), (req, res) => {
   res.send("This is a path is protected by Keycloak.");
});

app.listen(port, () => {
   console.log(`Server is running at http://localhost:${port}`);
});

import { Request } from "express";

function generateSessionInfoHtml(req: Request) {
   var response = "";
   response += "<h1>Session info</h1>";
   response += "<pre>";
   response += JSON.stringify(req.session, null, 4);
   response += "</pre>";

   var keycloakTokenStr = req.session["keycloak-token"];
   if (keycloakTokenStr) {
      response += "<h1>Keycloak</h1>";

      var keycloakToken = JSON.parse(keycloakTokenStr);
      response += "<pre>";
      response += JSON.stringify(keycloakToken, null, 4);
      response += "</pre>";

      response += "<h1>Id token</h1>";
      var idToken = keycloakToken["id_token"];
      var idTokenDecoded = jwtDecode(idToken);
      response += "<pre>";
      response += JSON.stringify(idTokenDecoded, null, 4);
      response += "</pre>";

      response += "<h1>Access token</h1>";
      var accessToken = keycloakToken["access_token"];
      var accessTokenDecoded = jwtDecode(accessToken);
      response += "<pre>";
      response += JSON.stringify(accessTokenDecoded, null, 4);
      response += "</pre>";
   }
   return response;
}
