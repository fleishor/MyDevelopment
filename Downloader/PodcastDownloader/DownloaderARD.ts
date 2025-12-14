// Ende der Welt: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5915996"
// radioSpitzen: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5962920"

import { XMLParser } from "fast-xml-parser";
import { readFileSync } from "fs";
import { URL } from "url";

interface PodcastJson {
   rss: {
      channel: {
         item: {
            enclosure: { _url: string };
            pubDate: string;
         }[];
         link: string;
      };
   };
}

const xmlFile = readFileSync("Podcast.xml", "utf8");
const startDate = new Date("2025-10-23");

function GetFileName(parsedUrl: URL): string {
   const urlParts = parsedUrl.pathname.split("/");
   let fileName = "";

   for (let i = 0; i < urlParts.length; i++) {
      if (urlParts[i] === "feed") {
         fileName = urlParts[i + 1];
      }
   }

   return fileName + ".mp3";
}

function GetPodCastName(parsedUrl: URL): string {
   const urlParts = parsedUrl.pathname.split("/");
   let podCastName = "";

   for (let i = 0; i < urlParts.length; i++) {
      if (urlParts[i] === "sendung") {
         podCastName = urlParts[i + 1];
      }
   }

   return podCastName;
}

function GetTimeStamp(pubDate: Date): string {
   const year = ("0" + pubDate.getFullYear().toString()).slice(-2);
   const month = ("0" + (pubDate.getMonth() + 1).toString()).slice(-2);
   const day = ("0" + pubDate.getDate().toString()).slice(-2);
   const hour = ("0" + pubDate.getHours().toString()).slice(-2);
   const minute = ("0" + pubDate.getMinutes().toString()).slice(-2);
   const timestamp = year + month + day + "_" + hour + minute;

   return timestamp;
}

const options = {
   attributeNamePrefix: "_",
   ignoreAttributes: false,
};

const parser = new XMLParser(options);

const json = parser.parse(xmlFile) as PodcastJson;
const url: URL = new URL(json.rss.channel.link);
const podCastName = GetPodCastName(url);

for (const item of json.rss.channel.item) {
   const url: URL = new URL(item.enclosure._url);
   const downloadUrl: string = item.enclosure._url;
   const pubDate: Date = new Date(item.pubDate);

   if (pubDate < startDate) continue;

   const podFileName = GetFileName(url);
   const pubDateStr = GetTimeStamp(pubDate);

   console.log("echo ./downloads/" + podCastName + "/" + pubDateStr + "_" + podFileName);
   console.log("curl --location " + downloadUrl + " --create-dirs --output ./download/" + podCastName + "/" + pubDateStr + "_" + podFileName);
}
