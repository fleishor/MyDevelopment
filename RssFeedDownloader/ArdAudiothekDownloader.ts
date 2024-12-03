import { gql, GraphQLClient, Variables } from "graphql-request";
import { GetBookmarksByLoginId } from "./getBookmarksByLoginId";
import { GetMultipleEpisodes } from "./getMultipleEpisodes";

const loginId = "";
const bearerToken = "";

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
