// const { MongoClient } = require("mongodb");
import { MongoClient } from "mongodb";
const MONGO_URI =
  // "mongodb+srv://new_admin:3arOiFzdUypLPZPv@sujith0.y5ljbwv.mongodb.net/?retryWrites=true&w=majority&appName=sujith0";
  // "mongodb+srv://admin:QpuN5li3kfcO6A3C@sujith0.y5ljbwv.mongodb.net/?retryWrites=true&w=majority&appName=sujith0";
  // "mongodb+srv://sujith1:80OOprpA0nba07bQ@cluster0.dwypa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  "mongodb+srv://new_admin:3arOiFzdUypLPZPv@sujith0.y5ljbwv.mongodb.net/?retryWrites=true&w=majority&appName=sujith0";
const client = new MongoClient(MONGO_URI);
const db = client.db("MyBuilding");
export { client, db };
