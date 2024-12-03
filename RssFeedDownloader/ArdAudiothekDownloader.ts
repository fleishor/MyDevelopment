import { gql, GraphQLClient, Variables } from "graphql-request";
import { GetBookmarksByLoginId } from "./getBookmarksByLoginId";
import { GetMultipleEpisodes } from "./getMultipleEpisodes";

const loginId = "o0EUM8cEXgS6XA7xZjfaWIYVKfo1";
const bearerToken =
   "eyJhbGciOiJSUzI1NiIsImtpZCI6IjNmZDA3MmRmYTM4MDU2NzlmMTZmZTQxNzM4YzJhM2FkM2Y5MGIyMTQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSG9yc3QgRmxlaXNjaGVyIiwicGljdHVyZSI6Imh0dHBzOi8vYWNjb3VudHMuYXJkLmRlL3Byb2ZpbGVJbWFnZXMvcHJvZmlsZUltYWdlMS5wbmciLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYXJkbXQtcHJvZCIsImF1ZCI6ImFyZG10LXByb2QiLCJhdXRoX3RpbWUiOjE3MzI4OTY5MjksInVzZXJfaWQiOiJvMEVVTThjRVhnUzZYQTd4WmpmYVdJWVZLZm8xIiwic3ViIjoibzBFVU04Y0VYZ1M2WEE3eFpqZmFXSVlWS2ZvMSIsImlhdCI6MTczMjg5NjkyOSwiZXhwIjoxNzMyOTAwNTI5LCJlbWFpbCI6ImhvcnN0LmZsZWlzY2hlckB3ZWIuZGUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJob3JzdC5mbGVpc2NoZXJAd2ViLmRlIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiY3VzdG9tIn19.RWeTGUU5FmQ-rsJnXxstkzS8n10VOUhbdwyptS_8loQ4-hJTSnRL0zB_2ensr2PVo7lT7j0PnFS2k_jLoDHqhIY8jbDDiBbCoZ1_Y5yVvDz6ns1wDHABZPjoGF7pHd_ambG-4JVKsj8IRsGJH6aam5FOWnFiA5AvRB1y67Vz67mQP4755eaF0O9K1fQgq-GnHWBydA-Wzkd82mRZelzrHHF7glMQFhNgnq0ZLdJU05lkzUCDJhbHj9XS3H_ezu6yt3GgiHpbCvUdJCPISsWOEpqcGoGJFDYFZ0de5An06xNaimOJ5YJMCdBOYo68Do2aXkHvGmUjXn3g7wRRqwdqRg";

const endpoint = "https://api.ardaudiothek.de/graphql";

const graphQLClient = new GraphQLClient(endpoint, {
   method: "GET",
   jsonSerializer: {
      parse: JSON.parse,
      stringify: JSON.stringify,
   },
   headers: {
      Authorization: "Bearer " + bearerToken,
   },
});

const getBookmarksByLoginIdQuery = gql`
   query GetBookmarksByLoginId($loginId: String!, $count: Int = 1000) {
      allEndUsers(filter: { loginId: { eq: $loginId } }) {
         count
         nodes {
            id
            syncSuccessful
            bookmarks {
               id
               entries(first: $count, orderBy: BOOKMARKEDAT_DESC) {
                  nodes {
                     bookmarkedAt
                     item {
                        id
                        coreId
                     }
                  }
               }
            }
         }
      }
   }
`;

const getBookmarksByLoginIdVariables: Variables = {
   loginId: loginId,
   count: 2000,
};

const multipleEpisodesQuery = gql`
   query MultipleEpisodesQuery($ids: [String]!) {
      itemsByIds(ids: $ids) {
         nodes {
            id
            title
            publishDate
            summary
            programSet {
               id
               title
            }
            audios {
               downloadUrl
            }
         }
      }
   }
`;

function GetTimeStamp(pubDate: Date): string {
   const year = ("0" + pubDate.getFullYear()).slice(-2);
   const month = ("0" + (pubDate.getMonth() + 1)).slice(-2);
   const day = ("0" + pubDate.getDate()).slice(-2);
   const hour = ("0" + pubDate.getHours()).slice(-2);
   const minute = ("0" + pubDate.getMinutes()).slice(-2);
   const timestamp = year + month + day + "_" + hour + minute;

   return timestamp;
}

function GetFileName(parsedUrl: URL): string {
   const urlFileName = parsedUrl.pathname;
   const urlParts = urlFileName.split("/");
   const downloadFileName = urlParts[urlParts.length - 2];
    
   return downloadFileName + ".mp3";
}

async function getMultipleEpisodes(bookmarkIds: unknown) {
   try {
      const multipleEpisodesVariables = { ids: bookmarkIds };
      const items = await graphQLClient.request<GetMultipleEpisodes>(multipleEpisodesQuery, multipleEpisodesVariables);
      if (items) {
         for (const audio of items.itemsByIds.nodes) {
            const downloadUrl = audio.audios[0].downloadUrl;
            const url = new URL(downloadUrl);
            const podFileName = GetFileName(url);
            const pubDateStr = GetTimeStamp(audio.publishDate);
            const podCastName = audio.programSet.title;
         }
      }
   } catch (error) {
      console.error("Error in main function response:", error);
   }
}

async function getIdsFromBookmarks(bookmarks: GetBookmarksByLoginId) {
   const bookmarkNodes = bookmarks.allEndUsers.nodes[0].bookmarks.entries.nodes;
   const bookmarkIds = [];
   for (const bookmarkNode of bookmarkNodes) {
      bookmarkIds.push(bookmarkNode.item.id);
   }
   await getMultipleEpisodes(bookmarkIds);
}

async function getBookmarksByLoginId() {
   try {
      const data = await graphQLClient.request<GetBookmarksByLoginId>(getBookmarksByLoginIdQuery, getBookmarksByLoginIdVariables);
      if (data) {
         await getIdsFromBookmarks(data);
      }
   } catch (error) {
      console.error("Error in main function response:", error);
   }
}

async function main() {
   await getBookmarksByLoginId();
}

main();
