import { gql, GraphQLClient} from "graphql-request"

const endpoint = "https://api.ardaudiothek.de/graphql"

const graphQLClient = new GraphQLClient(endpoint, {
  method: "GET",
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
})

const query = gql`
query 
ProgramSetEpisodesQuery($id:ID!,$offset:Int!,$count:Int!)
{
  result:programSet(id:$id)
  {
    items(
      offset:$offset 
      first:$count 
      filter:{isPublished:{equalTo:true},itemType:{notEqualTo:EVENT_LIVESTREAM}}
    )
    {
      pageInfo
      {
        hasNextPage 
        endCursor
      }
      nodes
      {
        title 
        publishDate 
        audios
        {
          downloadUrl 
        }
      }
    }
  }
}`

const variables = {
   "id":"5915996",
   "offset":0,
   "count":24
 };
 
async function main() {
   try {
     const data = await graphQLClient.request(query, variables);
     console.log(JSON.stringify(data));
   } catch (error) {
     console.error("Error in main function response:", error);
   }
 }
 
 main();
