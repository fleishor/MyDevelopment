// src/index.ts
import express from "express";
import axios from "axios";
import { Request, Response } from "express";
import session from "express-session";
import { jwtDecode } from "jwt-decode";
import { MemoryStore } from "express-session";
import KeycloakConnect from "keycloak-connect";
import qs from "qs";

declare module "express-session" {
   interface SessionData {
      "keycloak-token": any;
   }
}

KeycloakConnect.prototype.redirectToLogin = function (req: any) {
   const apiReqMatcher = /\/api\//i;
   return !apiReqMatcher.test(req.originalUrl || req.url);
};

const app = express();
const port = 3001;
const memoryStore = new MemoryStore();
const keycloak = new KeycloakConnect(
   {
      store: memoryStore,
      scope: "",
   },
   "./keycloak.json"
);



// Session-Management konfigurieren
app.use(
   session({
      secret: "ExpressSessionSecret",
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
app.get("/showSessionInfo", (req, res) => {
   var response = generateUrlLinks();
   response += generateSessionInfoHtml(req);
   res.send(response);
});

// Login-Endpunkt
app.get("/login", keycloak.protect(), (req, res) => {
   const iss = req.query.iss;
   if (iss) {
      var response = generateUrlLinks();
      response += generateSessionInfoHtml(req);
      res.send(response);
   }
});

// Logout-Endpunkt
app.post("/logout", (req, res) => {
   req.session.destroy((err) => {
      if (err) {
         return res.status(500).send("Failed to logout.");
      }
      var response = generateUrlLinks();
      response += generateSessionInfoHtml(req);
      res.send(response);
   });
});

// Gesicherte Route mit Bearer-Token-Authentifizierung
app.get("/api/rolebased/secured", keycloak.protect("BaseDataAppManager"), (req, res) => {
   res.send("This is a path is protected by Keycloak.");
});

app.get("/api/directaccess/secured", async (req, res) => {
   try {
      const token = await getDirectAccessToken("fleishor", "fleishor");
      res.json({ message: "Login successful", token });
   } catch (error) {
      res.status(500).json({ message: "Error obtaining token", error });
   }
});

app.listen(port, () => {
   console.log(`Server is running at http://localhost:${port}`);
});

async function getDirectAccessToken(username: string, password: string) {
   const response = await axios.post(
      "http://docker.fritz.box:8081/auth//realms/fleishor/protocol/openid-connect/token",
      qs.stringify({
         grant_type: "password",
         client_id: "BaseDataApp",
         client_secret: "MvYCXMtWwYoM5yxnX4kCmc7UroTCepTe",
         username,
         password,
      }),
      {
         headers: {
            "Content-Type": "application/x-www-form-urlencoded",
         },
      }
   );
   return response.data.access_token;
}

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

      var idToken = keycloakToken["id_token"];
      var idTokenDecoded = jwtDecode(idToken);

      var accessToken = keycloakToken["access_token"];
      var accessTokenDecoded = jwtDecode(accessToken);

      response += "<h1>Times</h1>";
      var idTokenExpire = idTokenDecoded.exp ? new Date(idTokenDecoded.exp * 1000).toISOString() : "undefined";
      var idTokenIssuedAt = idTokenDecoded.iat ? new Date(idTokenDecoded.iat * 1000).toISOString() : "undefined";
      response += "<pre>";
      response += "ID Token issued at: " + idTokenIssuedAt + "\n";
      response += "ID Token expires at: " + idTokenExpire + "\n";
      response += "</pre>";

      response += "<h1>Id token</h1>";
      response += "<pre>";
      response += JSON.stringify(idTokenDecoded, null, 4);
      response += "</pre>";

      response += "<h1>Access token</h1>";
      response += "<pre>";
      response += JSON.stringify(accessTokenDecoded, null, 4);
      response += "</pre>";
   }
   return response;
}

function generateUrlLinks() {
   var response = "";
   response += "<h1>URLs</h1>";
   response += "<pre>";
   response += "<a href='/'>Home</a>\n";
   response += "<a href='/showSessionInfo'>Show Session Info</a>\n";
   response += "<a href='/login'>Login</a>\n";
   response += "<a href='/logout'>Logout</a>\n";
   response += "<a href='/api/rolebased/secured'>Role-based Secured API</a>\n";
   response += "<a href='/api/directaccess/secured'>Direct-access Secured API</a>\n";
   response += "</pre>";

   return response;
}
