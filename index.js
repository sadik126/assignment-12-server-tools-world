const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middleware
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('tools are running')
})

app.listen(port, () => {
    console.log('running port', port)
})




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wrh8i.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//     const collection = client.db("products").collection("tools");
//     console.log(collection)
//     // perform actions on the collection object
//     client.close();
// });


async function run() {
    try {
        await client.connect()
        const toolscollection = client.db("products").collection("tools")

        app.get('/tools', async (req, res) => {
            const query = {}
            const cursor = toolscollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })


        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: ObjectId(id)
            }
            const service = await toolscollection.findOne(query)
            res.send(service)
        })


        app.get('/purchase', async (req, res) => {

        })

    }
    finally {

    }
}
run().catch(console.dir)
