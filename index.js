const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kunr0xg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();//remove this before sending to production

        const foodCollection = client.db('flavorFusion').collection('food');
        const purchaseFoodCollection = client.db('flavorFusion').collection('purchaseFood');
        const galleryCollection = client.db('flavorFusion').collection('gallery');

        //Purchase Data api

        app.get('/purchaseFood', async (req, res) => {
            console.log(req.query)
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await purchaseFoodCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/purchaseFood', async (req, res) => {
            const purchaseFood = req.body;
            console.log(purchaseFood);
            const result = await purchaseFoodCollection.insertOne(purchaseFood);
            res.send(result);
        })

        app.delete('/purchaseFood/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await purchaseFoodCollection.deleteOne(query);
            res.send(result);
        })


        //Foods Data api

        app.get('/foods', async (req, res) => {
            console.log(req.query)
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await foodCollection.find(query).toArray();
            res.send(result);
        })



        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodCollection.findOne(query);
            res.send(result)
        });



        app.post('/foods', async (req, res) => {
            const food = req.body;
            console.log(food);
            const result = await foodCollection.insertOne(food);
            res.send(result);
        });

        app.put('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateFood = req.body;

            const food = {
                $set: {
                    foodName: updateFood.foodName,
                    foodImage: updateFood.foodImage,
                    foodCategory: updateFood.foodCategory,
                    price: updateFood.price,
                    foodOrigin: updateFood.foodOrigin,
                    quantity: updateFood.quantity,
                    ingredients: updateFood.ingredients,
                    making: updateFood.making,
                    description: updateFood.description
                }
            }

            const result = await foodCollection.updateOne(filter, food, options);
            res.send(result);
        })


        //Gallery Data api
        app.get('/gallery', async (req, res) => {
            const cursor = galleryCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/gallery/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await galleryCollection.findOne(query);
            res.send(result)
        })

        app.post('/gallery', async (req, res) => {
            const gallery = req.body;
            console.log(gallery);
            const result = await galleryCollection.insertOne(gallery);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");//remove this before sending to production
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('flavor fusion is running')
})

app.listen(port, () => {
    console.log(`Flavor Fusion server is running on port ${port}`)
})