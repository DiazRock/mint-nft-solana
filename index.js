import { Connection, clusterApiUrl, Keypair, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import splToken from '@solana/spl-token'

(async () => {
    // Connect to cluster
    const connection = new Connection(
      clusterApiUrl("devnet"),
      'confirmed',
    );
  
    // Generate a new wallet keypair and airdrop SOL
    const fromWallet = Keypair.generate();
    const fromAirdropSignature = await connection.requestAirdrop(
      fromWallet.publicKey,
      LAMPORTS_PER_SOL,
    );
    //wait for airdrop confirmation
    await connection.confirmTransaction(fromAirdropSignature);
  
    //create new token mint
    const mint = await splToken.Token.createMint(
      connection,
      fromWallet,
      fromWallet.publicKey,
      null,
      9,
      splToken.TOKEN_PROGRAM_ID,
    );
  
    //get the token account of the fromWallet Solana address, if it does not exist, create it
    const fromTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
      fromWallet.publicKey,
    );
  
     // Generate a new wallet to receive newly minted token
     const toWallet = Keypair.generate();
  
    //get the token account of the toWallet Solana address, if it does not exist, create it
    const toTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
      toWallet.publicKey,
    );
  
    //minting 1 new token to the "fromTokenAccount" account we just returned/created
    await mint.mintTo(
      fromTokenAccount.address, //who it goes to
      fromWallet.publicKey, // minting authority
      [], // multisig
      1000000000, // how many
    );
  
    await mint.setAuthority(
      mint.publicKey,
      null,
      "MintTokens",
      fromWallet.publicKey,
      []
    )
  
    // Add token transfer instructions to transaction
    const transaction = new Transaction().add(
      splToken.Token.createTransferInstruction(
        splToken.TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet.publicKey,
        [],
        1,
      ),
    );
  
    // Sign transaction, broadcast, and confirm
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromWallet],
      {commitment: 'confirmed'},
    );
    console.log('SIGNATURE', signature);
  })();