import { Connection, 
         clusterApiUrl, 
         Keypair, 
         LAMPORTS_PER_SOL, 
         Transaction, 
         sendAndConfirmTransaction } from '@solana/web3.js';
import splToken from '@solana/spl-token'
import Wallet from '@project-serum/sol-wallet-adapter'
//import { connection } from './src/connection'

(async () => {
    
    // Connect to a cluster
    const connection = new Connection(
        clusterApiUrl("devnet"),
        'confirmed'
      );

    // Connect to a wallet service.
    const provideUrl = 'https://www.sollet.io' // There must be an existing wallet.
    const wallet = new Wallet(provideUrl);
    wallet.on('connect', publicKey => console.log('Connected to ' + publicKey.toBase58()))
    wallet.on('disconnect', () => console.log('Disconnected'))
    await wallet.connect()

    // Generate an airdrop SOL
    const fromAirdropSignature = await connection.requestAirdrop(
      wallet.publicKey,
      LAMPORTS_PER_SOL,
    );
    //wait for airdrop confirmation
    await connection.confirmTransaction(fromAirdropSignature);
  
    //create new token mint
    const mint = await splToken.Token.createMint(
      connection,
      wallet,
      wallet.publicKey,
      null,
      9,
      splToken.TOKEN_PROGRAM_ID,
    );
  
    //get the token account of the wallet Solana address, if it does not exist, create it
    const fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
      wallet.publicKey,
    );
  
     // You can return the minted token to a new wallet, or to the old one. 
     const toWallet = wallet;
  
    //get the token account of the toWallet Solana address, if it does not exist, create it
    const toTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
      toWallet.publicKey,
    );
  
    //minting 1 new token to the "fromTokenAccount" account we just returned/created
    await mint.mintTo(
      fromTokenAccount.address, //who it goes to
      wallet.publicKey, // minting authority
      [], // multisig
      1000000000, // how many
    );
  
    await mint.setAuthority(
      mint.publicKey,
      null,
      "MintTokens",
      wallet.publicKey,
      []
    )
    console.log(mint)
    // Add token transfer instructions to transaction
    const transaction = new Transaction().add(
      splToken.Token.createTransferInstruction(
        splToken.TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        toTokenAccount.address,
        wallet.publicKey,
        [],
        1,
      ),
    );
  
    // Sign transaction, broadcast, and confirm
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
      {commitment: 'confirmed'},
    );
    console.log('SIGNATURE', signature);
  })();