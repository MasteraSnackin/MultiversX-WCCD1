import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { UserWallet, AddressComputer } from '@multiversx/sdk-core';
import axios from 'axios';

// Constants
const SHARD_COUNT = 3; // Number of shards in the network
const ACCOUNTS_PER_SHARD = 3; // Number of accounts to create per shard
const FAUCET_URL = 'https://r3d4.fr/faucet'; // URL of the third-party faucet service

// Function to generate accounts
async function generateAccounts() {
  // Initialize an array to hold accounts for each shard
  const accounts = Array.from({ length: SHARD_COUNT }, () => []);
  // Create an AddressComputer to determine shard assignments
  const addressComputer = new AddressComputer(SHARD_COUNT);

  // Loop through each shard
  for (let shard = 0; shard < SHARD_COUNT; shard++) {
    // Continue generating accounts until the required number is reached
    while (accounts[shard].length < ACCOUNTS_PER_SHARD) {
      // Generate a random mnemonic (a sequence of words used to derive a seed)
      const mnemonic = generateMnemonic();
      // Convert mnemonic to a seed
      const seed = mnemonicToSeedSync(mnemonic);
      // Create a wallet from the seed
      const wallet = UserWallet.fromSeed(seed);
      // Get the wallet's address in bech32 format
      const address = wallet.getAddress().bech32();

      // Determine the shard for the address
      const shardId = addressComputer.getShardOfAddress(address);

      // Ensure the account is placed in the correct shard
      if (shardId === shard) {
        accounts[shard].push({ address, mnemonic });
      }
    }
  }

  return accounts; // Return the generated accounts
}

// Function to display accounts
function displayAccounts(accounts) {
  // Loop through each shard and display account details
  for (let shard = 0; shard < SHARD_COUNT; shard++) {
    console.log(`Shard ${shard}:`);
    accounts[shard].forEach(({ address, mnemonic }, index) => {
      console.log(`  Account ${index + 1}:`);
      console.log(`    Address: ${address}`);
      console.log(`    Mnemonic: ${mnemonic}\n`);
    });
  }
}

// Function to request tokens from the faucet
async function requestTokens(address) {
  try {
    // Send a POST request to the faucet with the account address
    const response = await axios.post(FAUCET_URL, { address });
    console.log(`Faucet request for ${address}: ${response.data}`);
  } catch (error) {
    // Log an error message if the request fails
    console.error(`Error requesting tokens for ${address}:`, error.response ? error.response.data : error.message);
  }
}

async function main() {
  // Generate accounts
  const accounts = await generateAccounts();

  // Display account information
  displayAccounts(accounts);

  // Request tokens for each account
  for (let shard = 0; shard < SHARD_COUNT; shard++) {
    for (let { address } of accounts[shard]) {
      await requestTokens(address);
    }
  }

  // Instructions for manual fauceting
  console.log(
    'Please visit the MultiversX faucet at https://devnet-wallet.multiversx.com/ and request tokens for the following addresses if needed.\n'
  );

  console.log(
    'Note: You will need to log in using the MultiversX web wallet to complete the fauceting process manually.\n'
  );
}

// Execute the main function and handle any errors
main().catch((error) => {
  console.error('Error:', error);
});