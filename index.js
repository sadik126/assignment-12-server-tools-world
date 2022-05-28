const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 4000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');


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

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        await client.connect()
        const toolscollection = client.db("products").collection("tools")
        const bookingcollection = client.db("products").collection("booking")
        const usercollection = client.db("products").collection("user")
        const paymentcollection = client.db("products").collection("payments")


        app.get('/tools', async (req, res) => {
            const query = {}
            const cursor = toolscollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })

        app.post('/tools', async (req, res) => {
            const newService = req.body;
            const result = await toolscollection.insertOne(newService)
            res.send(result);
        })

        app.get('/bookings', async (req, res) => {
            const query = {}
            const cursor = bookingcollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })

        app.post('/create-payment-intent', async (req, res) => {
            const service = req.body;
            const price = service.total;
            console.log(price)
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'inr',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });


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


        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usercollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await usercollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await usercollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
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

        app.get('/booking', async (req, res) => {
            const email = req.query.email
            console.log(email)
            const query = { email: email }
            const bookings = await bookingcollection.find(query).toArray()
            res.send(bookings);
        })

        app.get('/user', verifyJWT, async (req, res) => {
            const users = await usercollection.find().toArray();
            res.send(users);
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await bookingcollection.deleteOne(query)
            res.send(result)
        })

        app.delete('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await toolscollection.deleteOne(query)
            res.send(result)
        })

        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await bookingcollection.findOne(query)
            res.send(result)
        })

        app.patch('/bookings/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const result = await paymentcollection.insertOne(payment);
            const updatedBooking = await bookingcollection.updateOne(filter, updatedDoc);
            res.send(updatedBooking);
        })

    }
    finally {

    }
}
run().catch(console.dir)
