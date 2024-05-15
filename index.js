const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(
    cors({
        origin: [
            "http://localhost:5173",
        ],
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kunr0xg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const logger = (req, res, next) => {
    console.log(req.method, req.url);
    next();
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;

    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)

        const foodCollection = client.db('flavorFusion').collection('food');
        const purchaseFoodCollection = client.db('flavorFusion').collection('purchaseFood');
        const galleryCollection = client.db('flavorFusion').collection('gallery');

        // Auth related api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            }).send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })


        //Purchase Data api
        app.get('/purchaseFood', verifyToken, async (req, res) => {
            if (req.user?.email !== req.query?.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await purchaseFoodCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/purchaseFood', async (req, res) => {
            const purchaseFood = req.body;
            const result = await purchaseFoodCollection.insertOne(purchaseFood);
            res.send(result);
        });

        // As wanted
        app.post('/purchaseFood', async (req, res) => {
            const purchaseFood = req.body;
            const foodId = purchaseFood.foodId;

            // Increment purchase count for the purchased food item
            await foodCollection.updateOne({ _id: new ObjectId(foodId) }, { $inc: { purchaseCount: 1 } });

            // Insert purchase data
            const result = await purchaseFoodCollection.insertOne(purchaseFood);
            res.send(result);
        });


        app.delete('/purchaseFood/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await purchaseFoodCollection.deleteOne(query);
            res.send(result);
        })


        //Foods Data api

        app.get('/foods', async (req, res) => {
            const cursor = foodCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/myFoods', logger, verifyToken, async (req, res) => {
            if (req.user?.email !== req.query?.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
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
        });


        app.get('/searchFoods', async (req, res) => {
            const { query } = req.query;
            const cursor = foodCollection.find({ foodName: { $regex: query, $options: 'i' } });
            const result = await cursor.toArray();
            res.send(result);
        });



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
            const result = await galleryCollection.insertOne(gallery);
            res.send(result);
        });


    } finally {
        
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('flavor fusion is running')
})

app.listen(port, () => {
    console.log(`Flavor Fusion server is running on port ${port}`)
})