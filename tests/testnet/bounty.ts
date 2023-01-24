// import { Bounty } from '../../src/contracts/bounty'
// import { dummyUTXO, inputSatoshis, signAndSend } from './util/txHelper';
// import { getUtxoManager } from './util/utxoManager';
// import { privateKey } from './util/privateKey';
// import {
//     bsv,
//     ByteString,
//     FixedArray,
//     hash160,
//     PubKey,
//     PubKeyHash,
//     Ripemd160,
//     Sig,
//     toByteString,
//     toHex,
//     utf8ToByteString,
//  } from 'scrypt-ts';
// import { sign } from 'crypto';

// // SET UP
// const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
// const pubKey = PubKey(toHex(publicKey))
// const pkh: PubKeyHash = PubKeyHash(hash160(pubKey))

// const winnerPrivateKey = bsv.PrivateKey.fromRandom('testnet')
// const winnerPublicKey = winnerPrivateKey.publicKey
// const winnerPubKey = PubKey(toHex(winnerPublicKey))
// const winnerPKH: PubKeyHash = PubKeyHash(hash160(winnerPubKey))

// const emptyHunters: FixedArray<PubKeyHash, 3> = [
//     Ripemd160(toByteString('00')),
//     Ripemd160(toByteString('00')),
//     Ripemd160(toByteString('00'))
// ]
// const defaultOpen = true
// const nullWinner = Ripemd160(toByteString('00'))

// // TEST FUNCTIONS
// async function testBountyLifecycle() {
//     const fee = 230
//     const utxoMgr = await getUtxoManager();
//     let utxos = await utxoMgr.getUtxos();
//     // create a genesis instance
//     let instance = new Bounty(
//                         pubKey,
//                         emptyHunters,
//                         defaultOpen,
//                         nullWinner
//                     ).markAsGenesis()
//     // construct a transaction for deployment
//     const unsignedDeployTx = instance.getDeployTx(utxos, 1)
//     const deployTx = await signAndSend(unsignedDeployTx);
//     console.log('Bounty deploy tx:', deployTx.id);
//     utxoMgr.collectUtxoFrom(deployTx)

//     // 1 - submit
//     // 1. build a new contract instance
//     let nextInstance = instance.next()
//     // 2. apply the updates on the new instance.
//     const hunter1: Ripemd160 = winnerPKH
//     const submission1: ByteString = utf8ToByteString('submission1')
//     const hunters: FixedArray<PubKeyHash, 3> = [
//         hunter1,
//         Ripemd160(toByteString('00')),
//         Ripemd160(toByteString('00')),
//     ]
//     const submissions: FixedArray<ByteString, 3> = [
//         submission1,
//         utf8ToByteString('0'),
//         utf8ToByteString('0'),
//     ]
//     nextInstance.hunters = hunters
//     nextInstance.submissions = submissions
//     nextInstance.submissionCount = 1n
//     // 3. construct a transaction for contract call
//     utxos = await utxoMgr.getUtxos(fee)
//     const unsignedSubmitTx = instance.getSubmitTx(
//         utxos,
//         deployTx,
//         nextInstance,
//         hunter1,
//         submission1
//     )
//     const submitTx = await signAndSend(unsignedSubmitTx)
//     console.log('Submit tx:', submitTx.id);
//     utxoMgr.collectUtxoFrom(submitTx)

//     instance = nextInstance
//     // 2 - select
//     const selectInputIndex = 1
//     nextInstance = instance.next()
//     nextInstance.winner = hunter1
//     nextInstance.open = false
//     utxos = await utxoMgr.getUtxos(fee)
//     const unsignedSelectTx = instance.getSelectTx(
//         utxos,
//         submitTx,
//         nextInstance,
//         privateKey,
//         hunter1
//     )
//     const selectTx = await signAndSend(unsignedSelectTx)
//     console.log('Select tx:', selectTx.id);
//     utxoMgr.collectUtxoFrom(selectTx)

//     instance = nextInstance
//     // 3 - claim
//     const claimInputIndex = 0
//     nextInstance = instance.next()
//     const unsignedClaimTx = instance.getClaimTx(
//         winnerPublicKey,
//         winnerPrivateKey,
//         selectTx
//     )
//     const claimTx = await signAndSend(unsignedClaimTx)
//     console.log('Claim tx:', claimTx.id);
//     utxoMgr.collectUtxoFrom(claimTx)
// }

// // RUN TESTS
// describe('Test Bounty Lifecycle', () => {
//     before(async () => {
//         await Bounty.compile()
//     })

//     it('pass - submit, select, claim', async () => {
//         await testBountyLifecycle()
//     })

// })
