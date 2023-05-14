const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

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
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

// Verify user authorization using jwt token
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect((err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

    const carDoctor = client.db("carDoctor");
    const services = carDoctor.collection("services");
    const bookings = carDoctor.collection("bookings");

    // For jwt token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Get all service
    app.get("/services", async (req, res) => {
      const cursor = services.find({});
      const allValues = await cursor.toArray();
      res.send(allValues);
    });

    // Get specific service for booking
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, price: 1, img: 1, service_id: 1 },
      };
      const result = await services.findOne(query, options);
      res.send(result);
    });

    // Get user booking all data
    app.get("/bookings", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      const queryEmail = req.query.email;

      if (decoded.email !== queryEmail) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }

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

    // Booked specific service
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

    // Update booked specific service
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          // status: updateData.status,
          ...updateData,
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

    // Delete booked specific service
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
