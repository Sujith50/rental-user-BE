import http from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import jwt from "jsonwebtoken";

import { client } from "./db.js";
import { typeDefs } from "./schema/typeDef.js";
import { resolvers } from "./schema/resolvers.js";

const jwtSecret = "Test@123";
const getUserFromToken = (token) => {
  try {
    if (token) {
      return jwt.verify(token.replace(/\s+/i, ""), jwtSecret).uuid;
    }
  } catch {
    console.error("Invalid token");
  }
  return null;
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // 1️⃣ Enable CORS for your GraphQL endpoint (and any other routes)
  app.use(
    "/graphql",
    cors()
    //   {
    //   origin: "http://localhost:3001", // allow your front‑end origin
    //   methods: ["GET", "POST", "OPTIONS"],
    //   allowedHeaders: ["Content-Type", "Authorization"],
    // }
  );

  // 2️⃣ ApolloServer setup
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(apolloServer, {
      context: ({ req }) => {
        const token = req.headers.authorization || "";
        return { user: getUserFromToken(token) };
      },
    })
  );

  // 3️⃣ WebSocket server (subscriptions)
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  useServer(
    {
      schema: apolloServer.schema,
      context: (ctx) => {
        const token = ctx.connectionParams?.authorization || "";
        return { user: getUserFromToken(token) };
      },
    },
    wsServer
  );

  // 4️⃣ Start
  await client.connect();
  console.log("MongoDB connected");

  httpServer.listen(5000, () => {
    console.log(`🚀 HTTP + WS listening on http://localhost:5000/graphql`);
  });
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
