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
        const bookingcollection = client.db("products").collection("booking")
        const usercollection = client.db("products").collection("user")

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

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { name: booking.name, email: booking.email, product: booking.product, phone: booking.phone, price: booking.price, amount: booking.amount }
            const exists = await bookingcollection.findOne(query)
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingcollection.insertOne(booking)

            res.send({ success: true, result });
        })


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const option = { upsert: true };
            const updatedDoc = {
                $set: user,
            }
            const result = await usercollection.updateOne(filter, updatedDoc, option)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ result, token })
        })

    }
    finally {

    }
}
run().catch(console.dir)
