"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const authorizationToken = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IkhNQUNTSEE1MTItMSJ9.eyJ1cm46b2x5bXA6YXV0aHR5cGUiOiJhdXRob3JpemF0aW9uX2NvZGUiLCJzdWIiOiJBOTJFNUU5Mi05NkY2LUZFRDMtMEUzRTIxRjdEMDRCRjgwMSIsInVybjpvbHltcDpjbGllbnRpZCI6Ijc2NDRkZjk2NjRiYzQ3MTNiOWExZDhkZGM2ZTI1MWNjIiwidXJuOm9seW1wOmFwcGxpY2F0aW9uaWQiOiIxMiIsInVybjpvbHltcDpyb2xlIjpbImludGVybmFsIiwidXNlciJdLCJ1cm46YW1wbGl0dWRlOmRldmljZWlkIjoiNzY0NGRmOTY2NGJjNDcxM2I5YTFkOGRkYzZlMjUxY2M6QTkyRTVFOTItOTZGNi1GRUQzLTBFM0UyMUY3RDA0QkY4MDEiLCJ1cm46YW1wbGl0dWRlOnNlc3Npb25pZCI6IjE3MjQyNzI3NTciLCJ1cm46YW1wbGl0dWRlOnVzZXJpZCI6Ijc4MTU1NSIsInVybjpzYXZldHY6YW1wbGl0dWRlOnVzZXJjcmVhdGVkYXRlIjoiMTU0NDcyODQ2NSIsImN1bHR1cmUiOiJkZS1ERSIsIi5yZWZyZXNoIjoiRmFsc2UiLCIuaXNzdWVkIjoiV2VkLCAyMSBBdWcgMjAyNCAyMDozOToxNyBHTVQiLCIuZXhwaXJlcyI6IldlZCwgMjEgQXVnIDIwMjQgMjE6Mzk6MTcgR01UIiwiY2xpZW50X2lkIjoiNzY0NGRmOTY2NGJjNDcxM2I5YTFkOGRkYzZlMjUxY2MiLCJpc3MiOiJTYXZlVFYuQXV0aG9yaXphdGlvblNlcnZlckFwcCIsImV4cCI6IjE3MjQyNzYzNTcifQ.hSeku3lWcBGRiX4s_FsbDWGN03_h5vkMItDtkDIMUQaZXFfCr9wr6sustDlr5v8fHsuP2rb4VUasY-Pv_HL5gw";
const getRecordingsUrl = "https://api.save.tv/v3/records" +
    "?adFreeAvailable=true" +
    "&fields=telecast.episode" +
    "&fields=telecast.title" +
    "&fields=telecast.subtitle" +
    "&limit=100" +
    "&recordFormats=6" +
    "&recordStates=3" +
    "&sort=title" +
    "&sort=subtitle";
const getDownloadUrlTemplate = "https://api.save.tv/v3/records/${telecastId}/downloads/6?adFree=true";
async function downloadRecordings(url) {
    const response = await axios_1.default.get(url, {
        headers: {
            "Authorization": `${authorizationToken}`
        }
    });
    return response;
}
async function downloadUrl(url) {
    const response = await axios_1.default.get(url, {
        headers: {
            "Authorization": `${authorizationToken}`
        }
    });
    return response;
}
async function main() {
    const recordings = await downloadRecordings(getRecordingsUrl);
    if (recordings.status != 200) {
        console.error(`Download failed; Status: ${recordings.status} - ${recordings.statusText}`);
        process.exit(1);
    }
    for (const recording of recordings.data) {
        const telecast = recording.telecast;
        const getDownloadUrl = getDownloadUrlTemplate.replace("${telecastId}", telecast.id);
        const downloadUrls = await downloadUrl(getDownloadUrl);
        if (downloadUrls.status != 200) {
            console.error(`Download failed; Status: ${downloadUrls.status} - ${downloadUrls.statusText}`);
            process.exit(1);
        }
        telecast.downloadUrl = downloadUrls.data.downloadUrl;
        telecast.fileName = telecast.title + "_" +
            telecast.episode + "_" +
            telecast.subTitle + "_" +
            telecast.id + ".mp4";
        telecast.fileName = telecast.fileName.replace(/ /g, "_").replace(/-/g, "_");
        console.log("wget -O ./download/" + telecast.fileName + " " + telecast.downloadUrl);
    }
}
main();
