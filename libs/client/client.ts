import { ApolloClient, InMemoryCache } from "@apollo/client";
const HOMEPAGE_URL = process.env.NEXT_PUBLIC_HOMEPAGE_URL;

const client = new ApolloClient({
  uri: HOMEPAGE_URL + "/api/graphql",
  cache: new InMemoryCache(),
});

export default client;
