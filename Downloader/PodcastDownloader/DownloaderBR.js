"use strict";
// curl -o  "Podcast.xml" "https://feeds.br.de/auf-ein-wort/feed.xml"
// curl -o  "Podcast.xml" "https://feeds.br.de/evangelische-morgenfeier/feed.xml"
// curl -o  "Podcast.xml" "https://feeds.br.de/katholische-morgenfeier/feed.xml"
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = require("url");
var fast_xml_parser_1 = require("fast-xml-parser");
var fs_1 = require("fs");
var xmlFile = (0, fs_1.readFileSync)("Podcast.xml", "utf8");
var startDate = new Date("2025-10-23");
function GetFileName(parsedUrl) {
    var urlFileName = parsedUrl.pathname;
    var urlParts = urlFileName.split("/");
    var downloadFileName = urlParts[urlParts.length - 2];
    return downloadFileName + ".mp3";
}
function GetPodCastName(parsedUrl) {
    var urlParts = parsedUrl.pathname.split("/");
    var podCastName = "";
    for (var i = 0; i < urlParts.length; i++) {
        if (urlParts[i] === "podcast") {
            podCastName = urlParts[i + 1];
        }
    }
    return podCastName;
}
function GetTimeStamp(pubDate) {
    var year = ("0" + pubDate.getFullYear()).slice(-2);
    var month = ("0" + (pubDate.getMonth() + 1)).slice(-2);
    var day = ("0" + pubDate.getDate()).slice(-2);
    var hour = ("0" + pubDate.getHours()).slice(-2);
    var minute = ("0" + pubDate.getMinutes()).slice(-2);
    var timestamp = year + month + day + "_" + hour + minute;
    return timestamp;
}
var options = {
    ignoreAttributes: false,
    attributeNamePrefix: "_",
};
var parser = new fast_xml_parser_1.XMLParser(options);
var json = parser.parse(xmlFile);
for (var _i = 0, _a = json.rss.channel.item; _i < _a.length; _i++) {
    var item = _a[_i];
    var url = new url_1.URL(item.link);
    var downloadUrl = item.enclosure._url;
    var pubDate = new Date(item.pubDate);
    if (pubDate < startDate)
        continue;
    var podFileName = GetFileName(url);
    var pubDateStr = GetTimeStamp(pubDate);
    var podCastName = GetPodCastName(url);
    console.log("echo ./download/" + podCastName + "/" + pubDateStr + "_" + podCastName + "_" + podFileName);
    console.log("curl --location " + downloadUrl + " --create-dirs --output ./download/" + podCastName + "/" + pubDateStr + "_" + podCastName + "_" + podFileName);
}
