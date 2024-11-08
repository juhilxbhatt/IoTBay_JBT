const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

// MongoDB connection string
const uri = "mongodb+srv://Juhil:LOcRO08NWfCAoGib@iotbay.w6qgafn.mongodb.net/?retryWrites=true&w=majority&appName=IoTBay";

// Create a new MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB
async function connectToDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db("test");
    const usersCollection = database.collection("users");
    const ProductsCollection = database.collection("products");
    
    // Set EJS as the view engine
    app.set('view engine', 'ejs');

    // Body parser middleware
    app.use(express.static('public'));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(session({
        secret: '123',
        resave: false,
        saveUninitialized: true
    }));
    app.use((req, res, next) => {
      res.locals.cart = req.session.cart || {};
      next();
    });
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    // Fetch all products
    const products = await ProductsCollection.find({}).toArray();

    // Routes
    // Render index page with products
    app.get('/', (req, res) => {
      try {
        res.render('index', { products });
      } catch (error) {
        console.log('Error in fetching products:', error);
        res.status(500).send('Error in fetching products');
      }
    });

    // Alias route for index
    app.get('/index', (req, res) => {
      try {
        res.render('index', { products });
      } catch (error) {
        console.log('Error in fetching products:', error);
        res.status(500).send('Error in fetching products');
      }
    });

    // Render login page
    app.get('/login', function(req, res){
      try {
        res.render('login');
      } catch (error) {
        console.log('Error in login loading:', error);
        res.status(500).send('Error in login loading');
      }
    });

    // Render cart page with session cart data
    app.get('/cart', function(req, res){
      try {
        res.render('cart', { cart: req.session.cart });
      } catch (error) {
        console.log('Error in cart loading:', error);
        res.status(500).send('Error in cart loading');
      }
    });

    // Handle login post request
    app.post('/login', async (req, res) => {
      const { username, password } = req.body;
      const user = await usersCollection.findOne({ username, password });
      if (!user) {
        res.send('Invalid username or password');
      } else {
        res.render('dashboard', {
          username: user.username
        });
      }
    });

    // Add to Cart route
    app.post('/addToCart', (req, res) => {
      const productId = req.body.productId;
      // Initialize cart in session if not already exists
      req.session.cart = req.session.cart || {};
      // Add product to cart or increment quantity
      req.session.cart[productId] = (req.session.cart[productId] || 0) + 1;
      res.redirect('/');
    });

    // Example: Update product stock
    const productId = '664069cc770992bdb835a03e'; // Example product ID
    const filter = { _id: new ObjectId(productId) };
    const update = { $set: { DeviceStock: 10-1 } }; // Example update
    try {
        const result = await ProductsCollection.updateOne(filter, update);
        console.log(`${result.modifiedCount} document(s) updated`);
    } catch (error) {
        console.error('Error updating product:', error);
    }

    // Start server
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDB();