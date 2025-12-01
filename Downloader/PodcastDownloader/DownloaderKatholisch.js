"use strict";
// curl -o  "Podcast.xml" "https://podcast.katholisch.de/1/2-abendgebet.xml"
// curl -o  "Podcast.xml" "https://podcast.katholisch.de/1/1-tagessegen.xml"
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = require("url");
var fast_xml_parser_1 = require("fast-xml-parser");
var fs_1 = require("fs");
var xmlFile = (0, fs_1.readFileSync)("Podcast.xml", "utf8");
var startDate = new Date("2025-10-23");
function GetFileName(parsedUrl) {
    var urlFileName = parsedUrl.pathname;
    var urlParts = urlFileName.split("/");
    var downloadFileName = urlParts[urlParts.length - 1];
    downloadFileName = downloadFileName.substring(downloadFileName.indexOf("-") + 1);
    return downloadFileName + ".mp3";
}
function GetTimeStamp(pubDate) {
    var year = ("0" + pubDate.getFullYear()).slice(-2);
    var month = ("0" + (pubDate.getMonth() + 1)).slice(-2);
    var day = ("0" + pubDate.getDate()).slice(-2);
    var timestamp = year + month + day;
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
    console.log("echo ./download/" + pubDateStr + "_" + podFileName);
    console.log("curl " + downloadUrl + " --create-dirs --output ./download/" + pubDateStr + "_" + podFileName);
}
