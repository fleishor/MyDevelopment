import { readFileSync } from "fs";
import { parse as parseUrl, UrlWithStringQuery } from "url";


function GetTimeStamp(actionTimestamp: number): string {
   const actionTimeStamp = new Date(actionTimestamp);
   const year = ("0" + actionTimeStamp.getFullYear()).slice(-2);
   const month = ("0" + (actionTimeStamp.getMonth() + 1)).slice(-2);
   const day = ("0" + actionTimeStamp.getDate()).slice(-2);
   const hour = ("0" + actionTimeStamp.getHours()).slice(-2);
   const minute = ("0" + actionTimeStamp.getMinutes()).slice(-2);
   const timestamp = year + month + day + "_" + hour + minute + "_";

   return timestamp;
}

function GetFileName(parsedUrl: UrlWithStringQuery): string {
   let urlFileName = parsedUrl.pathname;
   let urlParts = urlFileName.split("/");
   let downloadFileName = urlParts[urlParts.length - 1];

   return downloadFileName;
}

function GetPodCastName(parsedUrl: UrlWithStringQuery): string {
   let urlParts = parsedUrl.pathname.split("/");
   let podCastName = "";

   for (let i =0; i< urlParts.length; i++) {
      if (urlParts[i] === "podcast") {
         podCastName = urlParts[i + 1];
      }
   }

   return podCastName;
}

function DownloadKatholischDe(element: any, enclosureUrl: UrlWithStringQuery, canonicalUrl: UrlWithStringQuery) {
   let downloadFileName = GetFileName(canonicalUrl) + ".mp3";
   downloadFileName = downloadFileName.substring(downloadFileName.indexOf("-") + 1);
   const timestamp = GetTimeStamp(element.actionTimestamp);
   console.log("c:\\tools\\wget -O " + timestamp + downloadFileName + " " + element.enclosure[0].href);
}

function DownloadBrDe(element: any, enclosureUrl: UrlWithStringQuery, canonicalUrl: UrlWithStringQuery) {
   let downloadFileName = GetFileName(enclosureUrl);
   let podCastName = GetPodCastName(canonicalUrl);

   const timestamp = GetTimeStamp(element.actionTimestamp);
   console.log("c:\\tools\\wget -O " + timestamp + podCastName + "_" + downloadFileName + " " + element.enclosure[0].href);
}

try {
   // read contents of the file
   const fileContent = readFileSync("rssfeed.json", "utf-8");
   const rssfeed = JSON.parse(fileContent);

   rssfeed.items.forEach(element => {
      if (element.enclosure) {
         const url = element.canonicalUrl || element.enclosure[0].href;
         const parsedUrl = parseUrl(url);
         if (parsedUrl.hostname === "www.katholisch.de") {
            const enclosureUrl = parseUrl(element.enclosure[0].href);
            const canonicalUrl = parseUrl(element.canonicalUrl);
            DownloadKatholischDe(element, enclosureUrl, canonicalUrl);
         } else if (parsedUrl.hostname === "www.br.de") {
            const enclosureUrl = parseUrl(element.enclosure[0].href);
            const canonicalUrl = parseUrl(element.canonicalUrl);
            DownloadBrDe(element, enclosureUrl, canonicalUrl);
         }
      }
   });

} catch (err) {
   console.error(err);
}
