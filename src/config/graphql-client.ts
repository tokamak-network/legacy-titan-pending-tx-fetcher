import { GraphQLClient } from "graphql-request";
import dotenv from "dotenv";

dotenv.config();

export const l2GraphqlClient = new GraphQLClient(
  process.env.L2_GRAPH_NODE_GRAPHQL_ENDPOINT || "",
  {
    headers: {
      // Add any headers you need
      // 'Authorization': `Bearer ${process.env.API_TOKEN}`,
    },
  }
);

export const l1GraphqlClient = new GraphQLClient(
  process.env.L1_GRAPH_NODE_GRAPHQL_ENDPOINT || "",
  {
    headers: {},
  }
);
