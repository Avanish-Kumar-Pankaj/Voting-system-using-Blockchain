// import Web3 from 'web3';

async function sendServerRequest(endpoint, data) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}



/**
 * Displays the voter information and an optional success message in the voter-info-container.
 * @param {Object} voterDetails - The voter details object containing voterId, name, and constituency.
 * @param {string} [successMessage] - The success message to be displayed (optional).
 */
function displayVoterInfo(voterDetails = null, successMessage = null) {

  // Clear any previous content
  registrationForm.style.display = 'none';
  voterInfoContainer.style.display = 'block';
  voterInfoContainer.innerHTML = '';


  // Create a heading element for the success message (if provided)
  if (successMessage) {
    const successHeading = document.createElement('h3');
    successHeading.textContent = successMessage;
    successHeading.style.fontWeight = 'bold';
    successHeading.style.fontSize = '1.2rem';
    successHeading.style.marginBottom = '10px';
    successHeading.style.color = 'black';

    // Prepend the success heading to the voter-info-container
    voterInfoContainer.appendChild(successHeading);
  }

  if (voterDetails) {
    const nameElement = document.createElement('p');
    nameElement.textContent = `Name: ${voterDetails['name']}`;

    const ageElement = document.createElement('p');
    ageElement.textContent = `Age: ${voterDetails['age']}`;

    const genderElement = document.createElement('p');
    genderElement.textContent = `Gender: ${voterDetails['gender']}`;

    const constituency_nameElement = document.createElement('p');
    constituency_nameElement.textContent = `Constituency Name: ${voterDetails['constituency_name']}`;

    const constituencyElement = document.createElement('p');
    constituencyElement.textContent = `Constituency: ${voterDetails['constituency']}`;

    // Append the elements to the voter-info-container
    voterInfoContainer.appendChild(nameElement);
    voterInfoContainer.appendChild(ageElement);
    voterInfoContainer.appendChild(genderElement);
    voterInfoContainer.appendChild(constituency_nameElement);
    voterInfoContainer.appendChild(constituencyElement);
  }
}
// Function to handle voter registration
async function registerVoter(voterId, password, constituency) {
  try {
    // Send a request to the server with voter details
    const serverResponse = await sendServerRequest('/api/register',{ voterId, constituency });
    console.log('Server response:', serverResponse);

    if (!serverResponse) {
      // Server response is not okay
      registrationForm.style.display = 'none';
      display();
      voterInfoContainer.style.backgroundColor = '#d04444';
      displayVoterInfo(null, 'Voter not Found!');
      return;
    }

    const { contractAddress, contractABI, transactionData, Voterdetails } = serverResponse;

    if (!contractAddress || !contractABI || !transactionData || !Voterdetails) {
      throw new Error('Server did not return required data');
    }
    console.log('Voter Details :', Voterdetails);


    const web3 = new Web3(new Web3.providers.HttpProvider(transactionData.rpcUrl));

    // Create a contract instance
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // Convert voter ID and password to hashes
    const voterIdHash = web3.utils.keccak256(voterId);
    const passwordHash = web3.utils.keccak256(password);


    // Call the registerVoter function
    try {
      const tx = await contract.methods.registerVoter(voterIdHash, passwordHash, constituency).send({
        from: transactionData.relayerAddress,
        gas: transactionData.gasLimit,
        gasPrice: transactionData.gasPrice
      });
      console.log('Voter registration successful:', tx);
      display();
      voterInfoContainer.style.backgroundColor = '#afd08f';
      displayVoterInfo(Voterdetails, 'Voter registration successful!');
    } catch (error) {
      console.error('Error registering voter:', error);
      display();
      voterInfoContainer.style.backgroundColor = '#d04444';
      displayVoterInfo(null, 'Voter already registered!');
    }
  } catch (error) {
    console.error('Error registering voter:', error);
  }
}

function display() {
  voting.style.display = 'block';
  document.getElementById('Party-select').style.display = 'none';
  document.getElementById('vote').style.display = 'none';
  document.getElementById('logout').style.display = 'none';
}
async function loginVoter(voterId, password) {
  try {
    // Send a request to the server with voter details
    const serverResponse = await sendServerRequest('/api/login',{ voterId});
    console.log('Server response:', serverResponse);

    if (!serverResponse) {
      // Server response is not okay
      divlogin.style.display= 'none';
      display();
      voterInfoContainer.style.backgroundColor = '#d04444';
      displayVoterInfo(null, 'Voter not found!');
      return;
    }

    const { contractAddress, contractABI, transactionData, Voterdetails } = serverResponse;

    if (!contractAddress || !contractABI || !transactionData || !Voterdetails) {
      throw new Error('Server did not return required data');
    }
    console.log('Voter Details :', Voterdetails);
  
    // Create a Web3 instance
    const web3 = new Web3(new Web3.providers.HttpProvider(transactionData.rpcUrl));

    // Create a contract instance
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    // Convert voter ID and password to hashes
    const voterIdHash = web3.utils.keccak256(voterId);
    const passwordHash = web3.utils.keccak256(password);

    // Call the login function
    try {
      const tx = await contract.methods.login(voterIdHash, passwordHash).send({
        from: transactionData.relayerAddress,
        gas: transactionData.gasLimit,
        gasPrice: transactionData.gasPrice
      });
      console.log('Voter login successful:', tx);
      const voterInfo = await contract.methods.voters(voterIdHash).call();
      if (voterInfo.hasVoted) { displayVotedDetails(voterId, Voterdetails, voterInfo.partyVoted, contractAddress, contractABI, transactionData); }
      else
        displayVotingInterface(voterId, Voterdetails, contractAddress, contractABI, transactionData);

    } catch (error) {
      console.error('Error logging in voter:', error);
      divlogin.style.display= 'none';
      display();
      voterInfoContainer.style.backgroundColor = '#d04444';
      displayVoterInfo(null, 'Voter login failed!');
    }
  } catch (error) {
    console.error('Error logging in voter:', error);
  }
}

// Function to display the voting interface
async function displayVotingInterface(voterId, Voterdetails, contractAddress, contractABI, transactionData) {


  divlogin.style.display = 'none';
  voting.style.display = 'block';
  voterInfoContainer.innerHTML = '';
  const web3 = new Web3(new Web3.providers.HttpProvider(transactionData.rpcUrl));
  const contract = new web3.eth.Contract(contractABI, contractAddress);

  // Display voter details
  voterInfoContainer.style.backgroundColor = '#afd08f';
  displayVoterInfo(Voterdetails, 'Logged In');

  // Get registered parties from the contract
  const numParties = await contract.methods.numParties().call();

  // Create a select element for parties
  const partySelect = document.getElementById('Party-select');


  // Add an option for each party
  for (let i = 1; i <= numParties; i++) {
    const party = await contract.methods.partyList(i).call();
    const option = document.createElement('option');
    option.value = party.partyNumber;
    option.textContent = party.name;
    partySelect.appendChild(option);
  }

  const slider = document.getElementById('slider');
  slider.style.width= '100%';
  // Create vote and logout buttons
  const voteButton = document.getElementById('vote');

  voteButton.addEventListener('click', async () => {
    const selectedParty = partySelect.value;
    await vote(voterId, Voterdetails, selectedParty, contractAddress, contractABI, transactionData);
  });

  const logoutButton = document.getElementById('logout');
  logoutButton.addEventListener('click', async () => {
    await logout(voterId, contractAddress, contractABI, transactionData);
  });

}

// Function to handle voting
async function vote(voterId, Voterdetails, partyNumber, contractAddress, contractABI, transactionData) {
  try {
    const web3 = new Web3(new Web3.providers.HttpProvider(transactionData.rpcUrl));
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    const voterIdHash = web3.utils.keccak256(voterId);

    const tx = await contract.methods.vote(partyNumber, voterIdHash).send({
      from: transactionData.relayerAddress,
      gas: transactionData.gasLimit,
      gasPrice: transactionData.gasPrice
    });

    console.log('Vote successful:', tx);
    displayVotedDetails(voterId, Voterdetails, partyNumber, contractAddress, contractABI, transactionData);
  } catch (error) {
    console.error('Error voting:', error);
  }
}

// Function to handle logout
async function logout(voterId, contractAddress, contractABI, transactionData) {
  try {
    const web3 = new Web3(new Web3.providers.HttpProvider(transactionData.rpcUrl));
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    const voterIdHash = web3.utils.keccak256(voterId);

    const tx = await contract.methods.logout(voterIdHash).send({
      from: transactionData.relayerAddress,
      gas: transactionData.gasLimit,
      gasPrice: transactionData.gasPrice
    });
    // container.innerHTML = '';
    document.getElementById('Party-select').style.display = 'none';
    document.getElementById('vote').style.display = 'none';
    document.getElementById('logout').style.display = 'none';
    voterInfoContainer.style.backgroundColor = '#afd08f';
    displayVoterInfo(null, 'Logged Out Sucessfully');
    console.log('Logout successful:', tx);
    // Redirect or display a success message
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// Function to display the voted details
async function displayVotedDetails(voterId, Voterdetails, partyNumber, contractAddress, contractABI, transactionData) {
  loginForm.style.display = 'none';
  voting.style.display = 'block';

  const web3 = new Web3(new Web3.providers.HttpProvider(transactionData.rpcUrl));
  const contract = new web3.eth.Contract(contractABI, contractAddress);
  document.getElementById('Party-select').style.display = 'none';
  document.getElementById('vote').style.display = 'none';

  voterInfoContainer.style.backgroundColor = '#afd08f';
  displayVoterInfo(Voterdetails, 'Vote Sucessful!');
  const party = await contract.methods.partyList(partyNumber).call();
  const partyName = party.name;
  const PartynameElement = document.createElement('p');
  PartynameElement.textContent = `You voted for ${partyName}`;
  voterInfoContainer.appendChild(PartynameElement);

  const logoutButton = document.getElementById('logout');
  logoutButton.addEventListener('click', async () => {
    await logout(voterId, contractAddress, contractABI, transactionData);
  });
}
// Register event listeners
const registerVoterForm = document.getElementById('register');
registerVoterForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const voterId = registerVoterForm.elements['voterId'].value;
  const password = registerVoterForm.elements['password'].value;
  const constituency = registerVoterForm.elements['constituency'].value;

  await registerVoter(voterId, password, constituency);
});
// Login event listeners
const loginVoterForm = document.getElementById('log-in');
loginVoterForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const voterId = loginVoterForm.elements['voterId'].value;
  const password = loginVoterForm.elements['password'].value;
  await loginVoter(voterId, password);
});

const loginForm = document.getElementById('log-in');
const divlogin = document.getElementById('login-form')
const registrationForm = document.getElementById('registration-form');
const voterInfoContainer = document.getElementById('voter-info-container');
const container = document.getElementById('xyz');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const voting = document.getElementById('voting');

loginBtn.addEventListener('click', () => {
  location.replace(location.href);
});

registerBtn.addEventListener('click', () => {
  voting.style.display = 'none';
  //voterInfoContainer.style.display = 'none';
  divlogin.style.display = 'none';
  loginForm.style.display = 'none';
  registrationForm.style.display = 'block';
  registerBtn.classList.add('active');
  loginBtn.classList.remove('active');
});

