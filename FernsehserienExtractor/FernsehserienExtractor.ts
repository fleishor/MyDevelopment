import axios from "axios";
import axiosRetry from "axios-retry";
import * as cheerio from "cheerio";

const episodeGuideUrl = "https://www.fernsehserien.de/die-rosenheim-cops/episodenguide";

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

async function main() {
   const response = await axios.get(episodeGuideUrl);
   const $ = cheerio.load(response.data);

   const episodes = $('[data-event-category="liste-episoden"]');

   for (const episode of episodes) {
      const children = $(episode).children();
      let folgeFortlaufend = children.eq(1).clone().children().remove().end().text();
      let staffelFolge = children.eq(1).find("span > b").text();
      if (!staffelFolge) {
        staffelFolge = "00.00";
        folgeFortlaufend = "999";
      }
      const episodeName = children.eq(6).find("span[itemprop='name']").text();
      console.log(folgeFortlaufend + " - " + staffelFolge + " - " + episodeName);
   }
}

(async function () {
   await main();
})();
