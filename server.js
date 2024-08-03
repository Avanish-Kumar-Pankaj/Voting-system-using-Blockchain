const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const contractABI = require('./abis/votercontract.json');
require('dotenv').config();




app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, 'src')));

app.get('/reg', (req, res) => {
  res.sendFile(path.join(__dirname, '/src/register.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '/src/admin.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define the Voter schema
const voterSchema = new mongoose.Schema({
  voterId: String,
  name: String,
  age: Number,
  gender: String,
  constituency_name: String,
  constituency: Number,
  isRegistered: Boolean,
});

const Voter = mongoose.model('Voter', voterSchema);

// Define the Relayer schema
const relayerSchema = new mongoose.Schema({
  constituency: Number,
  relayerAddress: String,
  relayerPrivateKey: String,
});

const Relayer = mongoose.model('Relayer', relayerSchema);

// Contract address and ABI (assuming they are constant)
const contractAddress = process.env.CONTRACT_ADDRESS; // Replace with your contract address

// Endpoint to register a voter
app.post('/api/register', async (req, res) => {
  try {
    const { voterId, constituency } = req.body;

    console.log('Received registration request:', voterId, constituency);

    // Check if the voter exists in the database
    const voter = await Voter.findOne({ voterId, constituency });

    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    // Retrieve the relayer data for the constituency
    const relayer = await Relayer.findOne({ constituency });

    if (!relayer) {
      return res.status(404).json({ error: 'Relayer not found' });
    }
    console.log(relayer.relayerPrivateKey);
    // Create a transaction object
    const transactionData = {
      rpcUrl: 'http://127.0.0.1:7545',
      //relayerPrivateKey: relayer.relayerPrivateKey,
      relayerAddress: relayer.relayerAddress,
      gasLimit: 200000,
      gasPrice: BigInt(10) * BigInt(10 ** 9),
    };
    const Voterdetails = {
      voterId: voter.voterid,
      name: voter.name,
      age: voter.age,
      gender: voter.gender,
      constituency_name: voter.constituency_name,
      constituency: voter.constituency
    };
    transactionData.gasPrice = transactionData.gasPrice.toString();
    // Send the required data to the client
    res.json({
      contractAddress,
      contractABI,
      transactionData,
      Voterdetails
    });
  } catch (error) {
    console.error('Error registering voter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { voterId } = req.body;

    console.log('Received Voter Id:', voterId);

    // Check if the voter exists in the database
    const voter = await Voter.findOne({ voterId });

    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }
    const constituency = voter.constituency;

    // Retrieve the relayer data for the constituency
    const relayer = await Relayer.findOne({ constituency });

    if (!relayer) {
      return res.status(404).json({ error: 'Relayer not found' });
    }
    
    // Create a transaction object


    const transactionData = {
      rpcUrl: 'http://127.0.0.1:7545',
      //relayerPrivateKey: relayer.relayerPrivateKey,
      relayerAddress: relayer.relayerAddress,
      gasLimit: 200000,
      gasPrice: BigInt(10) * BigInt(10 ** 9),
    };
    transactionData.gasPrice = transactionData.gasPrice.toString();

    const Voterdetails = {
      voterId: voter.voterid,
      name: voter.name,
      age: voter.age,
      gender: voter.gender,
      constituency_name: voter.constituency_name,
      constituency: voter.constituency
    };
    // Send the required data to the client
    res.json({
      contractAddress,
      contractABI,
      transactionData,
      Voterdetails
    });
  } catch (error) {
    console.error('Error registering voter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
