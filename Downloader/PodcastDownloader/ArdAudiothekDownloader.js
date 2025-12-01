"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_request_1 = require("graphql-request");
var dotenv = require("dotenv");
dotenv.config();
var loginId = process.env.LOGIN_ID;
var bearerToken = process.env.AUTHORIZATION_TOKEN;
var endpoint = "https://api.ardaudiothek.de/graphql";
var graphQLClient = new graphql_request_1.GraphQLClient(endpoint, {
    method: "GET",
    jsonSerializer: {
        parse: JSON.parse,
        stringify: JSON.stringify,
    },
    headers: {
        Authorization: "Bearer " + bearerToken,
    },
});
var getBookmarksByLoginIdQuery = (0, graphql_request_1.gql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n   query GetBookmarksByLoginId($loginId: String!, $count: Int = 1000) {\n      allEndUsers(filter: { loginId: { eq: $loginId } }) {\n         count\n         nodes {\n            id\n            syncSuccessful\n            bookmarks {\n               id\n               entries(first: $count, orderBy: BOOKMARKEDAT_DESC) {\n                  nodes {\n                     bookmarkedAt\n                     item {\n                        id\n                        coreId\n                     }\n                  }\n               }\n            }\n         }\n      }\n   }\n"], ["\n   query GetBookmarksByLoginId($loginId: String!, $count: Int = 1000) {\n      allEndUsers(filter: { loginId: { eq: $loginId } }) {\n         count\n         nodes {\n            id\n            syncSuccessful\n            bookmarks {\n               id\n               entries(first: $count, orderBy: BOOKMARKEDAT_DESC) {\n                  nodes {\n                     bookmarkedAt\n                     item {\n                        id\n                        coreId\n                     }\n                  }\n               }\n            }\n         }\n      }\n   }\n"])));
var getBookmarksByLoginIdVariables = {
    loginId: loginId,
    count: 2000,
};
var multipleEpisodesQuery = (0, graphql_request_1.gql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n   query MultipleEpisodesQuery($ids: [String]!) {\n      itemsByIds(ids: $ids) {\n         nodes {\n            id\n            title\n            publishDate\n            summary\n            programSet {\n               id\n               title\n            }\n            audios {\n               downloadUrl\n            }\n         }\n      }\n   }\n"], ["\n   query MultipleEpisodesQuery($ids: [String]!) {\n      itemsByIds(ids: $ids) {\n         nodes {\n            id\n            title\n            publishDate\n            summary\n            programSet {\n               id\n               title\n            }\n            audios {\n               downloadUrl\n            }\n         }\n      }\n   }\n"])));
function GetTimeStamp(pubDate) {
    var year = ("0" + pubDate.getFullYear()).slice(-2);
    var month = ("0" + (pubDate.getMonth() + 1)).slice(-2);
    var day = ("0" + pubDate.getDate()).slice(-2);
    var hour = ("0" + pubDate.getHours()).slice(-2);
    var minute = ("0" + pubDate.getMinutes()).slice(-2);
    var timestamp = year + month + day + "_" + hour + minute;
    return timestamp;
}
function GetFileName(parsedUrl) {
    var urlFileName = parsedUrl.pathname;
    var urlParts = urlFileName.split("/");
    var downloadFileName = urlParts[urlParts.length - 1];
    return downloadFileName + ".mp3";
}
function getMultipleEpisodes(bookmarkIds) {
    return __awaiter(this, void 0, void 0, function () {
        var multipleEpisodesVariables, items, _i, _a, audio, downloadUrl, url, podFileName, pubDateStr, podCastName, downloadFileName, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    multipleEpisodesVariables = { ids: bookmarkIds };
                    return [4 /*yield*/, graphQLClient.request(multipleEpisodesQuery, multipleEpisodesVariables)];
                case 1:
                    items = _b.sent();
                    if (items) {
                        for (_i = 0, _a = items.itemsByIds.nodes; _i < _a.length; _i++) {
                            audio = _a[_i];
                            downloadUrl = audio.audios[0].downloadUrl;
                            url = new URL(downloadUrl);
                            podFileName = GetFileName(url);
                            pubDateStr = GetTimeStamp(new Date(audio.publishDate));
                            podCastName = audio.programSet.title;
                            downloadFileName = podCastName + "/" + pubDateStr + "_" + podFileName;
                            downloadFileName = downloadFileName.replace(/ /g, "_")
                                .replace(/-/g, "_")
                                .replace(/\?/g, "_")
                                .replace(/&/g, "_")
                                .replace(/:/g, "_");
                            console.log("echo ./downloads/" + podCastName + "/" + pubDateStr + "_" + podFileName);
                            console.log("curl --location " + downloadUrl + " --create-dirs --output ./download/" + downloadFileName);
                        }
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _b.sent();
                    console.error("Error in main function response:", error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getIdsFromBookmarks(bookmarks) {
    return __awaiter(this, void 0, void 0, function () {
        var bookmarkNodes, bookmarkIds, _i, bookmarkNodes_1, bookmarkNode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bookmarkNodes = bookmarks.allEndUsers.nodes[0].bookmarks.entries.nodes;
                    bookmarkIds = [];
                    for (_i = 0, bookmarkNodes_1 = bookmarkNodes; _i < bookmarkNodes_1.length; _i++) {
                        bookmarkNode = bookmarkNodes_1[_i];
                        bookmarkIds.push(bookmarkNode.item.id);
                    }
                    return [4 /*yield*/, getMultipleEpisodes(bookmarkIds)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getBookmarksByLoginId() {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, graphQLClient.request(getBookmarksByLoginIdQuery, getBookmarksByLoginIdVariables)];
                case 1:
                    data = _a.sent();
                    if (!data) return [3 /*break*/, 3];
                    return [4 /*yield*/, getIdsFromBookmarks(data)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error("Error in main function response:", error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getBookmarksByLoginId()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main();
var templateObject_1, templateObject_2;
