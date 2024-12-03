// curl -o  "Podcast.xml" "https://podcast.katholisch.de/1/2-abendgebet.xml"
// curl -o  "Podcast.xml" "https://podcast.katholisch.de/1/1-tagessegen.xml"

import { URL } from "url";
import { XMLParser, X2jOptionsOptional } from "fast-xml-parser";
import { readFileSync } from "fs";

const xmlFile = readFileSync("Podcast.xml", "utf8");
const startDate = new Date("2024-06-01");

function GetFileName(parsedUrl: URL): string {
   const urlFileName = parsedUrl.pathname;
   const urlParts = urlFileName.split("/");
   let downloadFileName = urlParts[urlParts.length - 1];
   downloadFileName = downloadFileName.substring(downloadFileName.indexOf("-") + 1);
    
   return downloadFileName + ".mp3";
}

function GetTimeStamp(pubDate: Date): string {
   const year = ("0" + pubDate.getFullYear()).slice(-2);
   const month = ("0" + (pubDate.getMonth() + 1)).slice(-2);
   const day = ("0" + pubDate.getDate()).slice(-2);
   const timestamp = year + month + day;

   return timestamp;
}

const options: X2jOptionsOptional = {
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

   console.log("echo ./download/" + pubDateStr + "_" + podFileName);
   console.log("curl " + downloadUrl + " --create-dirs --output ./download/" + pubDateStr + "_" + podFileName);
}
