"use strict";
// Ende der Welt: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5915996"
// radioSpitzen: curl -o "Podcast.xml" "http://docker.fritz.box:3010/index.php?show=5962920"
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = require("url");
var fast_xml_parser_1 = require("fast-xml-parser");
var fs_1 = require("fs");
var xmlFile = (0, fs_1.readFileSync)("Podcast.xml", "utf8");
var startDate = new Date("2025-10-23");
function GetFileName(parsedUrl) {
    var urlParts = parsedUrl.pathname.split("/");
    var fileName = "";
    for (var i = 0; i < urlParts.length; i++) {
        if (urlParts[i] === "feed") {
            fileName = urlParts[i + 1];
        }
    }
    return fileName + ".mp3";
}
function GetPodCastName(parsedUrl) {
    var urlParts = parsedUrl.pathname.split("/");
    var podCastName = "";
    for (var i = 0; i < urlParts.length; i++) {
        if (urlParts[i] === "sendung") {
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
var url = new url_1.URL(json.rss.channel.link);
var podCastName = GetPodCastName(url);
for (var _i = 0, _a = json.rss.channel.item; _i < _a.length; _i++) {
    var item = _a[_i];
    var url_2 = new url_1.URL(item.enclosure._url);
    var downloadUrl = item.enclosure._url;
    var pubDate = new Date(item.pubDate);
    if (pubDate < startDate)
        continue;
    var podFileName = GetFileName(url_2);
    var pubDateStr = GetTimeStamp(pubDate);
    console.log("echo ./downloads/" + podCastName + "/" + pubDateStr + "_" + podFileName);
    console.log("curl --location " + downloadUrl + " --create-dirs --output ./download/" + podCastName + "/" + pubDateStr + "_" + podFileName);
}
