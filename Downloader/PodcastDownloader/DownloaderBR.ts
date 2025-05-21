// curl -o  "Podcast.xml" "https://feeds.br.de/auf-ein-wort/feed.xml"
// curl -o  "Podcast.xml" "https://feeds.br.de/evangelische-morgenfeier/feed.xml"
// curl -o  "Podcast.xml" "https://feeds.br.de/katholische-morgenfeier/feed.xml"

import { URL } from "url";
import { XMLParser, X2jOptions } from "fast-xml-parser";
import { readFileSync } from "fs";

const xmlFile = readFileSync("Podcast.xml", "utf8");
const startDate = new Date("2025-03-29");

function GetFileName(parsedUrl: URL): string {
   const urlFileName = parsedUrl.pathname;
   const urlParts = urlFileName.split("/");
   const downloadFileName = urlParts[urlParts.length - 2];
    
   return downloadFileName + ".mp3";
}

function GetPodCastName(parsedUrl: URL): string {
   const urlParts = parsedUrl.pathname.split("/");
   let podCastName = "";

   for (let i = 0; i < urlParts.length; i++) {
      if (urlParts[i] === "podcast") {
         podCastName = urlParts[i + 1];
      }
   }

   return podCastName;
}

function GetTimeStamp(pubDate: Date): string {
   const year = ("0" + pubDate.getFullYear()).slice(-2);
   const month = ("0" + (pubDate.getMonth() + 1)).slice(-2);
   const day = ("0" + pubDate.getDate()).slice(-2);
   const hour = ("0" + pubDate.getHours()).slice(-2);
   const minute = ("0" + pubDate.getMinutes()).slice(-2);
   const timestamp = year + month + day + "_" + hour + minute;

   return timestamp;
}

const options: X2jOptions = {
   ignoreAttributes: false,
   attributeNamePrefix: "_",
};

const parser = new XMLParser(options);
const json = parser.parse(xmlFile);

for (const item of json.rss.channel.item) {
  
   const url: URL = new URL(item.link);
   const downloadUrl: string = item.enclosure._url;
   const pubDate: Date = new Date(item.pubDate);

   if (pubDate < startDate) continue;

   const podFileName = GetFileName(url);
   const pubDateStr = GetTimeStamp(pubDate);
   const podCastName = GetPodCastName(url);

   console.log("echo ./download/" + podCastName + "/" + pubDateStr + "_" + podCastName + "_" + podFileName);
   console.log("curl --location " + downloadUrl + " --create-dirs --output ./download/" + podCastName + "/" + pubDateStr + "_" + podCastName + "_" + podFileName);
}
