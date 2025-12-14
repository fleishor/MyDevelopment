import * as dotenv  from "dotenv";
import { gql, GraphQLClient } from "graphql-request";

interface AllEndUsers {
    count: number;
    nodes: AllEndUsersNode[];
}

interface AllEndUsersNode {
    bookmarks:      Bookmarks;
    id:             string;
    syncSuccessful: boolean;
}

interface Audio {
    downloadUrl: string;
}

interface Bookmarks {
    entries: Entries;
    id:      string;
}

interface Entries {
    nodes: EntriesNode[];
}

interface EntriesNode {
    bookmarkedAt: Date;
    item:         Item;
}

interface GetBookmarksByLoginId {
    allEndUsers: AllEndUsers;
}

interface GetMultipleEpisodes {
    itemsByIds: ItemsByIDS;
}

interface Item {
    coreId: string;
    id:     string;
    programSetId: number;
    title:  string;

}

interface ItemsByIDS {
    nodes: Node[];
}

interface Node {
    audios:      Audio[];
    id:          string;
    programSet:  ProgramSet;
    publishDate: Date;
    summary:     string;
    title:       string;
}

interface ProgramSet {
    id:    string;
    title: string;
}

dotenv.config();

const loginId = process.env.LOGIN_ID;
const bearerToken = process.env.AUTHORIZATION_TOKEN;

const endpoint = "https://api.ardaudiothek.de/graphql";

const graphQLClient = new GraphQLClient(endpoint, {
   headers: {
      Authorization: "Bearer " + (bearerToken ?? ""),
   },
   jsonSerializer: {
      parse: JSON.parse,
      stringify: JSON.stringify,
   },
   method: "GET",
});

const getBookmarksByLoginIdQuery = gql`
   query GetBookmarksByLoginId($loginId: String!, $count: Int = 9000) {
      allEndUsers(filter: { loginId: { eq: $loginId } }) {
         count
         nodes {
            id
            syncSuccessful
            bookmarks {
               id
               entries(first: $count, orderBy: CREATEDAT_ASC) {
                  nodes {
                     bookmarkedAt
                     item {
                        id
                        coreId
                        title
                        programSetId
                     }
                  }
               }
            }
         }
      }
   }
`;

const getBookmarksByLoginIdVariables = {
   count: 2000,
   loginId: loginId,
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

async function getBookmarksByLoginId() {
   try {
      const data = await graphQLClient.request<GetBookmarksByLoginId>(getBookmarksByLoginIdQuery, getBookmarksByLoginIdVariables);
      await getIdsFromBookmarks(data);
   } catch (error) {
      console.error("Error in main function response:", error);
   }
}

function GetFileName(parsedUrl: URL): string {
   const urlFileName = parsedUrl.pathname;
   const urlParts = urlFileName.split("/");
   const downloadFileName = urlParts[urlParts.length - 1];
    
   return downloadFileName;
}

async function getIdsFromBookmarks(bookmarks: GetBookmarksByLoginId) {
   const bookmarkNodes = bookmarks.allEndUsers.nodes[0].bookmarks.entries.nodes;
   const bookmarkIds = [];
   for (const bookmarkNode of bookmarkNodes) {
      if (bookmarkNode.item.programSetId ==  61704588)
      {
         bookmarkIds.push(bookmarkNode.item.id);
      }
   }
   await getMultipleEpisodes(bookmarkIds);
}

async function getMultipleEpisodes(bookmarkIds: unknown) {
   try {
      const multipleEpisodesVariables = { ids: bookmarkIds };
      const items = await graphQLClient.request<GetMultipleEpisodes>(multipleEpisodesQuery, multipleEpisodesVariables);
      for (const audio of items.itemsByIds.nodes) {
         const downloadUrl = audio.audios[0].downloadUrl;
         if (!downloadUrl)
         {
            console.error(audio.title + "hat keine Download URL");
            continue;
         }
         const url = new URL(downloadUrl);
         const podFileName = GetFileName(url);
         const pubDateStr = GetTimeStamp(new Date(audio.publishDate));
         const podCastName = audio.programSet.title;

         let downloadFileName = podCastName + "/" + pubDateStr + "_" + podFileName;
         downloadFileName = downloadFileName.replace(/ /g, "_")
                                            .replace(/-/g, "_")
                                            .replace(/\?/g, "_")
                                            .replace(/&/g, "_")
                                            .replace(/:/g, "_");
         console.log("echo ./downloads/" + podCastName + "/" + pubDateStr + "_" + podFileName);
         console.log("curl --location " + downloadUrl + " --create-dirs --output ./download/" + downloadFileName);
      }
   } catch (error) {
      console.error("Error in main function response:", error);
   }
}

function GetTimeStamp(pubDate: Date): string {
   const year = ("0" + pubDate.getFullYear().toString()).slice(-2);
   const month = ("0" + String(pubDate.getMonth() + 1)).slice(-2);
   const day = ("0" + pubDate.getDate().toString()).slice(-2);
   const hour = ("0" + pubDate.getHours().toString()).slice(-2);
   const minute = ("0" + pubDate.getMinutes().toString()).slice(-2);
   const timestamp = year + month + day + "_" + hour + minute;

   return timestamp;
}

async function main() {
   await getBookmarksByLoginId();
}

void main();
