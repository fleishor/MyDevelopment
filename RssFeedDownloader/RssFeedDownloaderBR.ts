import { URL } from "url";
import { XMLParser, X2jOptionsOptional } from "fast-xml-parser";
import { readFileSync } from "fs";

const xmlFile = readFileSync("Podcast.xml", "utf8");

function GetFileName(parsedUrl: URL): string {
   const urlFileName = parsedUrl.pathname;
   const urlParts = urlFileName.split("/");
   const downloadFileName = urlParts[urlParts.length - 1];

   const fileNameParts = downloadFileName.split("-");
   const fileName = fileNameParts[1] + "_" +fileNameParts[2] + "-" +fileNameParts[3] + "-" +fileNameParts[4];

   return fileName + ".mp3";
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

const options: X2jOptionsOptional = {
   ignoreAttributes: false,
   attributeNamePrefix: "_",
};

const parser = new XMLParser(options);
const json = parser.parse(xmlFile);
const startDate = new Date("2020-01-01");

for (const item of json.rss.channel.item) {
  
   const url: URL = new URL(item.link);
   const downloadUrl: string = item.enclosure._url;
   const pubDate: Date = new Date(item.pubDate);

   if (pubDate < startDate) continue;

   const podCastName = GetPodCastName(url);
   const podFileName = GetFileName(url);
   const pubDateStr = GetTimeStamp(pubDate);

   console.log("c:\\tools\\wget -O ./downloads/" + pubDateStr + "_" + podCastName + "_" + podFileName + " " + downloadUrl);
}
