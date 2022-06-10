import { createServer, createPubSub } from "@graphql-yoga/node";
import type { NextApiRequest, NextApiResponse } from "next";
import client from "../../libs/server/client";
import { getSession } from "next-auth/react";

interface Player {
  id: number;
  position: number;
  name: string;
}

interface StartingGrid {
  players: Player[];
  lastEditor: String;
}

const pubSub = createPubSub<{
  startingGrid: [startingGrid: StartingGrid];
}>();

const typeDefs = `
  type Player {
    id: Int
    position: Int
    name: String
  }

  type StartingGrid {
    players: [Player!]!
    lastEditor: String
  }

  type Query {
    startingGrid: StartingGrid!
  }

  input PlayerInput {
    id: Int
    position: Int
    name: String
  }

  type Mutation {
    reorderStartingGrid(newPlayers: [PlayerInput!]!): StartingGrid!
  }

  type Subscription {
    feedStartingGrid: StartingGrid!
  }
`;

const authorization = async (context: any) => {
  const session = context?.session;
  if (!session) throw new Error("Sign in Required");
  const email = context?.session?.user?.email;
  if (!email) throw new Error("Email Address is Required");
  const user = await client.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) throw new Error("You do not have permission");
};

const resolvers = {
  Query: {
    async startingGrid(parent: any, args: any, context: any) {
      await authorization(context);
      const currentPlayers = await client.player.findMany();
      const currentEditor = await client.lastEditor.findFirst({
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });
      const currentStartingGrid: StartingGrid = {
        players: currentPlayers,
        lastEditor: currentEditor?.user?.email || "",
      };
      return currentStartingGrid;
    },
  },
  Mutation: {
    async reorderStartingGrid(parent: any, args: any, context: any) {
      await authorization(context);
      const currentPlayers = await client.player.findMany();
      const currentEditor = await client.lastEditor.findFirst({
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });
      const currentStartingGrid: StartingGrid = {
        players: currentPlayers,
        lastEditor: currentEditor?.user?.email || "",
      };

      const newPlayers: [Player] = args.newPlayers;
      const newEditorEmail = context?.session?.user?.email || "";

      let reorder = false;
      if (currentPlayers.length === newPlayers.length) {
        currentPlayers.forEach((currentPlayer) => {
          const foundName = newPlayers.filter(function (newPlayer) {
            return (
              currentPlayer.name === newPlayer.name &&
              currentPlayer.id === newPlayer.id
            );
          });
          const foundPosition = newPlayers.filter(function (newPlayer) {
            return currentPlayer.position === newPlayer.position;
          });
          if (foundName.length !== 1 || foundPosition.length !== 1) {
            return currentStartingGrid;
          }
          if (foundName[0].position !== currentPlayer.position) {
            reorder = true;
          }
        });

        if (reorder) {
          const newEditor = await client.user.findUnique({
            where: {
              email: newEditorEmail,
            },
            select: {
              id: true,
            },
          });
          if (!newEditor) return currentStartingGrid;
          await client.player.deleteMany({});
          await client.player.createMany({
            data: newPlayers,
          });
          await client.lastEditor.deleteMany({});
          await client.lastEditor.create({
            data: {
              userId: newEditor.id,
            },
          });
          const finalPlayers = await client.player.findMany();
          const finalEditor = await client.lastEditor.findFirst({
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          });
          const finalStartingGrid: StartingGrid = {
            players: finalPlayers,
            lastEditor: finalEditor?.user?.email || "",
          };
          console.log("Reorder Starting Grid", finalStartingGrid);
          pubSub.publish("startingGrid", finalStartingGrid);
          return finalStartingGrid;
        }
      }
      return currentStartingGrid;
    },
  },
  Subscription: {
    feedStartingGrid: {
      subscribe: async (parent: any, args: any, context: any) => {
        await authorization(context);
        return pubSub.subscribe("startingGrid");
      },
      resolve: (payload: any) => payload,
    },
  },
};

const server = createServer<{
  req: NextApiRequest;
  res: NextApiResponse;
}>({
  schema: {
    typeDefs,
    resolvers,
  },
  context: async ({ req }) => {
    const session = await getSession({ req });
    return { session };
  },

  endpoint: "/api/graphql",
});

export default server;
