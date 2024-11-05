import axios, { AxiosResponse } from "axios";

const authorizationToken = ""

const getRecordingsUrl = "https://api.save.tv/v3/records" +
                        "?adFreeAvailable=true" +
                        "&fields=telecast.episode" +
                        "&fields=telecast.title" +
                        "&fields=telecast.subtitle" +
                        "&fields=formats.recordformat.id" + 
                        "&limit=100" +
                        "&recordFormats=5" +
                        "&recordFormats=6" +
                        "&recordStates=3" +
                        "&sort=title" +
                        "&sort=subtitle";

const getDownloadUrlTemplate = "https://api.save.tv/v3/records/${telecastId}/downloads/${recordFormatId}?adFree=true";

async function downloadRecordings(url: string): Promise<AxiosResponse> {
    const response = await axios.get(url, {
        headers: {
            "Authorization": `${authorizationToken}`
        }        
    });

    return response;
}

async function downloadUrl(url: string): Promise<AxiosResponse> {
    const response = await axios.get(url, {
        headers: {
            "Authorization": `${authorizationToken}`
        }        
    });

    return response;
}

async function main()
{
    const recordings = await downloadRecordings(getRecordingsUrl);
    if (recordings.status != 200) {
        console.error(`Download failed; Status: ${recordings.status} - ${recordings.statusText}`);
        process.exit(1);
    }

    for (const recording of recordings.data) {
        const telecast = recording.telecast;
        const recordFormatId = recording.formats[0].recordFormat.id;

        const getDownloadUrl = getDownloadUrlTemplate.replace("${telecastId}", telecast.id).replace("${recordFormatId}", recordFormatId);
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
