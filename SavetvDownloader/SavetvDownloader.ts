import express from "express";

const app = express();
const port = 3000; // Port, auf dem der Server lauscht

// Ihre Anwendungsdetails
const client_id = "7644df9664bc4713b9a1d8ddc6e251cc";
const redirect_uri = "https://api.save.tv/v3/docs/index.html";
const response_type = "token";

app.get("/authorize", (req, res) => {
   // Erstellen Sie die Autorisierungs-URL
   const authUrl = `https://auth.save.tv/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}`;

   // Öffnen Sie die Autorisierungs-URL im Standardbrowser des Benutzers
   res.writeHead(302, { location: authUrl });
   res.end();

});

app.get("/callback", (req, res) => {
   // Extrahieren Sie das Zugriffstoken aus der URL
   const accessToken = req.query.access_token;

   if (!accessToken) {
      res.send("Fehler beim Abrufen des Zugriffstokens. Bitte versuchen Sie es erneut.");
      return;
   }

   // Verwenden Sie das Zugriffstoken, um API-Anfragen zu stellen
   // ...

   res.send("Anmeldung erfolgreich!");
});

app.listen(port, () => {
   console.log(`Server läuft auf http://localhost:${port}`);
});
