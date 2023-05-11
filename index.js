const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6jia9zl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const carDoctor = client.db("carDoctor");
    const services = carDoctor.collection("services");
    const bookings = carDoctor.collection("bookings");

    app.get("/services", async (req, res) => {
      const cursor = services.find({});
      const allValues = await cursor.toArray();
      res.send(allValues);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, price: 1, img: 1, service_id: 1 },
      };
      const result = await services.findOne(query, options);
      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      const queryEmail = req.query.email;
      let query = {};
      if (queryEmail) {
        query = { email: queryEmail };
      }
      const options = {
        projection: { img: 1, service: 1, date: 1, price: 1, status: 1 },
      };
      const cursor = bookings.find(query, options);
      const allValues = await cursor.toArray();
      res.send(allValues);
    });

    app.post("/bookings", async (req, res) => {
      const bookingData = req.body;
      const result = await bookings.insertOne(bookingData);
      if (result.insertedId) {
        console.log("Booking successfully!");
      } else {
        console.log("Booking failed!");
      }
      res.send(result);
    });

    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: updateData.status,
        },
      };
      const result = await bookings.updateOne(filter, updateDoc);
      if (result.modifiedCount === 1) {
        console.log("Successfully updated one document.");
      } else {
        console.log("No documents matched the query. Updated 0 documents.");
      }
      res.send(result);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookings.deleteOne(query);
      if (result.deletedCount === 1) {
        console.log("Successfully deleted one document.");
      } else {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
