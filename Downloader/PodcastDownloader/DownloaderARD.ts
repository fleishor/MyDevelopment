// Ende der Welt: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5915996"
// radioSpitzen: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5962920"
// radioWissen: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5945518"
// IQ Wissenschaft und Forschung: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5941402"
// Radioreportage: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=47284568"
// Religion: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=61704588"
// Radiofeature: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5961998"
// Zeit für Bayern: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=7273948"
// Bayerisches Feuilleton: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5963112"

import { XMLParser } from "fast-xml-parser";
import { readFileSync } from "fs";
import { URL } from "url";

interface PodcastJson {
   rss: {
      channel: {
         item: {
            description: string;
            enclosure: { _url: string };
            pubDate: string;
            title: string;
         }[];
         link: string;
      };
   };
}

const xmlFile = readFileSync("Podcast.xml", "utf8");
const startDate = new Date("2026-03-01");

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

   const downloadUrl: string = item.enclosure._url;
   const pubDate: Date = new Date(item.pubDate);

   if (pubDate < startDate) continue;

   const podFileName = item.title.replace(/ö/g, "oe")
                                 .replace(/ä/g, "ae")
                                 .replace(/ü/g, "ue")
                                 .replace(/ß/g, "ss")
                                 .replace(/[^a-zA-Z0-9]/g, "_") + ".mp3";
   const pubDateStr = GetTimeStamp(pubDate);
   const title = item.title.replace(/"/g, '')
                           .replace(/\n/g, ' ')
                           .replace(/‘/g, "")
                           .replace(/ – /g, " - ")
                           .replace(/ö/g, "oe")
                           .replace(/ä/g, "ae")
                           .replace(/ü/g, "ue")
                           .replace(/Ö/g, "Oe")
                           .replace(/Ä/g, "Ae")
                           .replace(/Ü/g, "ue")
                           .replace(/ß/g, "ss");
   const comment = item.description.replace(/"/g, '')
                                   .replace(/\n/g, ' ')
                                   .replace(/‘/g, "")
                                   .replace(/ – /g, " - ")
                                   .replace(/ö/g, "oe")
                                   .replace(/ä/g, "ae")
                                   .replace(/ü/g, "ue")
                                   .replace(/Ö/g, "Oe")
                                   .replace(/Ä/g, "Ae")
                                   .replace(/Ü/g, "ue")
                                   .replace(/ß/g, "ss")
                                   .replace(/Ein Podcast von .../g, '');

   console.log("echo ./downloads/" + podCastName + "/" + pubDateStr + "_" + podFileName);
   console.log("curl --location " + downloadUrl + " --create-dirs --output ./download/" + podCastName + "/" + pubDateStr + "_" + podFileName);
   console.log("eyed3 --title \"" + title + "\" --comment \"" + comment + "\" ./download/" + podCastName + "/" + pubDateStr + "_" + podFileName);
}
