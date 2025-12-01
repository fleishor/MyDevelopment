import { gql, GraphQLClient } from "graphql-request";
import * as dotenv  from "dotenv";

export interface GetBookmarksByLoginId {
    allEndUsers: AllEndUsers;
}

export interface AllEndUsers {
    count: number;
    nodes: AllEndUsersNode[];
}

export interface AllEndUsersNode {
    id:             string;
    syncSuccessful: boolean;
    bookmarks:      Bookmarks;
}

export interface Bookmarks {
    id:      string;
    entries: Entries;
}

export interface Entries {
    nodes: EntriesNode[];
}

export interface EntriesNode {
    bookmarkedAt: Date;
    item:         Item;
}

export interface Item {
    id:     string;
    coreId: string;
    title:  string;
    programSetId: number;

}

export interface GetMultipleEpisodes {
    itemsByIds: ItemsByIDS;
}

export interface ItemsByIDS {
    nodes: Node[];
}

export interface Node {
    id:          string;
    title:       string;
    publishDate: Date;
    summary:     string;
    programSet:  ProgramSet;
    audios:      Audio[];
}

export interface Audio {
    downloadUrl: string;
}

export interface ProgramSet {
    id:    string;
    title: string;
}


dotenv.config();

const loginId = process.env.LOGIN_ID;
const bearerToken = process.env.AUTHORIZATION_TOKEN;

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
   const downloadFileName = urlParts[urlParts.length - 1];
    
   return downloadFileName;
}

async function getMultipleEpisodes(bookmarkIds: unknown) {
   try {
      const multipleEpisodesVariables = { ids: bookmarkIds };
      const items = await graphQLClient.request<GetMultipleEpisodes>(multipleEpisodesQuery, multipleEpisodesVariables);
      if (items) {
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
      }
   } catch (error) {
      console.error("Error in main function response:", error);
   }
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
