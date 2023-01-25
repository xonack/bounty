import { Bounty } from '../../src/contracts/bounty'
import { dummyUTXO, inputSatoshis, signAndSend } from './util/txHelper'
import { getUtxoManager } from './util/utxoManager'
import { privateKey } from './util/privateKey'
import {
    bsv,
    FixedArray,
    hash160,
    PubKey,
    PubKeyHash,
    Ripemd160,
    toHex,
    toByteString,
} from 'scrypt-ts'
import { sign } from 'crypto'

const publicKey = privateKey.publicKey
const pubKey = PubKey(toHex(publicKey))
const pkh: PubKeyHash = PubKeyHash(hash160(pubKey))

const winnerPrivateKey = bsv.PrivateKey.fromRandom('testnet')
const winnerPublicKey = privateKey.publicKey
const winnerPubKey = PubKey(toHex(publicKey))
const winnerPKH: PubKeyHash = PubKeyHash(hash160(pubKey))

const emptyHunters: FixedArray<PubKeyHash, 3> = [
    Ripemd160(toByteString('00')),
    Ripemd160(toByteString('00')),
    Ripemd160(toByteString('00')),
]

describe('Test `Claim` SmartContract', () => {
    before(async () => {
        await Bounty.compile()
    })

    it('pass - valid winner claim', async () => {
        await validWinnerTest()
    })

    // it('fails - invalid public key', async () => {
    //     await invalidPubKeyTest()
    // })

    // it('fails - invalid signature', async () => {
    //     await invalidSignatureTest()
    // })

    // it('fails - invalid public key and corresponding signature', async () => {
    //     await invalidSigAndPubKeyTest()
    // })

    // it('fails - bounty still open', async () => {
    //     await bountyOpenTest()
    // })
})

async function validWinnerTest() {
    const utxoMgr = await getUtxoManager()
    const utxos = await utxoMgr.getUtxos()
    // create a genesis and deploy
    const instance = new Bounty(
        pubKey,
        emptyHunters,
        false,
        winnerPKH
    ).markAsGenesis()
    const unsignedDeployTx = instance.getDeployTx(utxos, inputSatoshis)
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('Submit deploy tx:', deployTx.id)
    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)

    const unsignedClaimTx = instance.getClaimTx(publicKey, privateKey, deployTx)
    const claimTx = await signAndSend(unsignedClaimTx)
    console.log('Claim call from winner ', pubKey, '.')
    console.log('TX ID: ', claimTx.id)
}

async function invalidPubKeyTest() {
    const utxoMgr = await getUtxoManager()
    const utxos = await utxoMgr.getUtxos()
    // create a genesis and deploy
    const instance = new Bounty(
        pubKey,
        emptyHunters,
        false,
        winnerPKH
    ).markAsGenesis()
    const unsignedDeployTx = instance.getDeployTx(utxos, inputSatoshis)
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('Submit deploy tx:', deployTx.id)
    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)

    const invalidPrivateKey = bsv.PrivateKey.fromRandom('testnet')
    const invalidPublicKey = bsv.PublicKey.fromPrivateKey(invalidPrivateKey)
    const invalidPubKey = PubKey(toHex(invalidPublicKey))
    console.log('FAILS HERE')
    const unsignedClaimTx = instance.getClaimTx(
        invalidPublicKey,
        privateKey,
        deployTx
    )
    console.log(
        'FAILS HERE due to verify: Script failed an OP_VERIFY operation'
    )
    const claimTx = await signAndSend(unsignedClaimTx)
    console.log('Claim call from invalid winner ', invalidPubKey, ' passed.')
    console.log('TX ID: ', claimTx.id)
}

async function invalidSignatureTest() {
    const utxoMgr = await getUtxoManager()
    const utxos = await utxoMgr.getUtxos()
    // create a genesis and deploy
    const instance = new Bounty(
        pubKey,
        emptyHunters,
        false,
        winnerPKH
    ).markAsGenesis()
    const unsignedDeployTx = instance.getDeployTx(utxos, inputSatoshis)
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('Submit deploy tx:', deployTx.id)
    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)

    const invalidPrivateKey = bsv.PrivateKey.fromRandom('testnet')
    const invalidPublicKey = bsv.PublicKey.fromPrivateKey(invalidPrivateKey)
    const invalidPubKey = PubKey(toHex(invalidPublicKey))
    const unsignedClaimTx = instance.getClaimTx(
        publicKey,
        invalidPrivateKey,
        deployTx
    )
    console.log(
        'FAILS HERE due to verify: Signature must be zero for failed CHECK(MULTI)SIG operation'
    )
    const claimTx = await signAndSend(unsignedClaimTx)
    console.log('Claim call from invalid winner ', pubKey, ' passed.')
    console.log('TX ID: ', claimTx.id)
}

async function invalidSigAndPubKeyTest() {
    const utxoMgr = await getUtxoManager()
    const utxos = await utxoMgr.getUtxos()
    // create a genesis and deploy
    const instance = new Bounty(
        pubKey,
        emptyHunters,
        false,
        winnerPKH
    ).markAsGenesis()
    const unsignedDeployTx = instance.getDeployTx(utxos, inputSatoshis)
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('Submit deploy tx:', deployTx.id)
    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)

    const invalidPrivateKey = bsv.PrivateKey.fromRandom('testnet')
    const invalidPublicKey = bsv.PublicKey.fromPrivateKey(invalidPrivateKey)
    const invalidPubKey = PubKey(toHex(invalidPublicKey))
    const unsignedClaimTx = instance.getClaimTx(
        invalidPublicKey,
        invalidPrivateKey,
        deployTx
    )
    console.log(
        'FAILS HERE due to verify: Script failed an OP_VERIFY operation'
    )
    const claimTx = await signAndSend(unsignedClaimTx)
    console.log('Claim call from invalid winner ', invalidPubKey, ' passed.')
    console.log('TX ID: ', claimTx.id)
}

async function bountyOpenTest() {
    const utxoMgr = await getUtxoManager()
    const utxos = await utxoMgr.getUtxos()
    // create a genesis and deploy
    const instance = new Bounty(
        pubKey,
        emptyHunters,
        true,
        Ripemd160(toByteString('00'))
    ).markAsGenesis()
    const unsignedDeployTx = instance.getDeployTx(utxos, inputSatoshis)
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('Submit deploy tx:', deployTx.id)
    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)

    const unsignedClaimTx = instance.getClaimTx(publicKey, privateKey, deployTx)
    console.log(
        'FAILS HERE due to verify: Script failed an OP_VERIFY operation'
    )
    const claimTx = await signAndSend(unsignedClaimTx)
    console.log('Claim call from invalid winner ', pubKey, ' passed.')
    console.log('TX ID: ', claimTx.id)
}
