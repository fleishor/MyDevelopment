import axios from "axios";
import axiosRetry from "axios-retry";
import * as cheerio from "cheerio";
import * as fsSync from 'fs';
import * as fsAsync from 'fs/promises';

class EpisodeDetails {
    episodeContinuous: string;
    seasonEpisode: string;
    episodeName: string;
    episodeDescription: string;

    constructor(episodeContinuous: string, seasonEpisode: string, episodeName: string, episodeDescription: string) {
        this.episodeContinuous = episodeContinuous;
        this.seasonEpisode = seasonEpisode;
        this.episodeName = episodeName;
        this.episodeDescription = episodeDescription;
    }
}

class SerieConfig {
   serienUrl: string;
   serieFileName: string;
 
   constructor(serienUrl: string, serieFileName: string) {
     this.serienUrl = serienUrl;
     this.serieFileName = serieFileName;
   }
 }

const baseUrl = "https://www.fernsehserien.de";

axiosRetry(axios, {
   retries: 3,
   retryDelay: (retryCount) => {
      return retryCount * 1000;
   },
   onRetry: (count, err) => {
      console.log(`retry attempt #${count} got ${err}`);
   },
   retryCondition: axiosRetry.isNetworkOrIdempotentRequestError,
});


async function saveEpisodeDetailsToFile(filename: string, data: EpisodeDetails[]) {
   const jsonData = JSON.stringify(data, null, 2);
   await fsAsync.writeFile(filename, jsonData, "utf8");
}

async function loadEpisodeDescription(episodeDescriptionUrl: string): Promise<string> {
   const response = await axios.get(episodeDescriptionUrl);
   const $episodeDescription = cheerio.load(response.data);

   const description = $episodeDescription('[class="episode-output-inhalt-inner"]').text();
   
   return description;
}

async function readConfiguration(filename: string): Promise<SerieConfig[]> {

   let serieConfigurationText = "";
   serieConfigurationText = await fsAsync.readFile(filename, "utf8");

   const serieConfigurationJson = JSON.parse(serieConfigurationText);
   return serieConfigurationJson;
}

async function main() {
   const serienConfiguration = await readConfiguration("./serien.json");

   for (const serieConfig of serienConfiguration) {

      if (fsSync.existsSync(serieConfig.serieFileName)) {
         console.log(`Datei ${serieConfig.serieFileName} existiert bereits. Überspringe...`);
         continue;
      }

      const serieUrl = baseUrl + serieConfig.serienUrl;
      const serieFileName = serieConfig.serieFileName;
      const episodeGuideUrl = serieUrl + "/episodenguide";
      
      const response = await axios.get(episodeGuideUrl);
      const $episoden = cheerio.load(response.data);

      const episodes = $episoden('[data-event-category="liste-episoden"]');
      const episodeDetailsArray: EpisodeDetails[] = [];

      for (const episode of episodes) {
         const children = $episoden(episode).children();
         
         const detailsUrl = $episoden(episode).attr("href");
         let episodeContinuous = children.eq(1).clone().children().remove().end().text();
         let seasonEpisode = children.eq(1).find("span > b").text();
         if (!seasonEpisode) {
            seasonEpisode = "00.00";
         episodeContinuous = "999";
         }
         const episodeName = children.eq(6).find("span[itemprop='name']").text();

         console.log("Extracted: " + episodeContinuous + " - " + seasonEpisode + " - " + episodeName);
         console.log("Download description for " +  episodeName);

         const episodeDescription = await loadEpisodeDescription(baseUrl + detailsUrl);

         episodeDetailsArray.push(new EpisodeDetails(episodeContinuous, seasonEpisode, episodeName, episodeDescription));
      }

      await saveEpisodeDetailsToFile(serieFileName, episodeDetailsArray);
   }
}

(async function () {
   await main();
})();
