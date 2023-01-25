import { Bounty } from '../../src/contracts/bounty'
import { expect } from 'chai'
import { dummyUTXO, signAndSend } from './util/txHelper'
import { getUtxoManager } from './util/utxoManager'
import { privateKey } from './util/privateKey'
import {
    bsv,
    FixedArray,
    PubKey,
    PubKeyHash,
    Ripemd160,
    toHex,
    toByteString,
} from 'scrypt-ts'

const defaultOpen = true
const defaultWinner = Ripemd160(toByteString('00'))

describe('select', () => {
    before(async () => {
        await Bounty.compile()
    })

    it('passes - valid hunter', async () => {
        await validHunterTest()
    })

    // it('fails - invalid Hunter', async () => {
    //     await invalidHunterTest()
    // })

    // it('fails- invalid signature', async () => {
    //     await invalidSignature()
    // })

    // it('fails - select twice (valid then valid)', async () => {
    //     await selectTwiceTest()
    // })
})

async function validHunterTest() {
    const utxoMgr = await getUtxoManager()
    let utxos = await utxoMgr.getUtxos()
    // deploy
    // constructor arguments
    const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
    const pubKey = PubKey(toHex(publicKey))
    const hunter1: Ripemd160 = Ripemd160(toByteString('01'))
    const hunter2: Ripemd160 = Ripemd160(toByteString('02'))
    const hunter3: Ripemd160 = Ripemd160(toByteString('03'))
    const hunters: FixedArray<PubKeyHash, 3> = [hunter1, hunter2, hunter3]
    // create a genesis instance
    const select = new Bounty(
        pubKey,
        hunters,
        defaultOpen,
        defaultWinner
    ).markAsGenesis()
    const unsignedDeployTx = select.getDeployTx(utxos, 1)
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('Submit deploy tx:', deployTx.id)
    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)
    // fee in satoshis for `callTx`, can be estimated in local tests by calling `tx.getEstimateFee()`.
    const prevTx = deployTx
    const fee = 230
    utxos = await utxoMgr.getUtxos(fee)
    const newSelect = select.next()
    newSelect.winner = hunter1
    newSelect.open = false
    const unsignedSelectTx = select.getSelectTx(
        utxos,
        prevTx,
        newSelect,
        privateKey,
        hunter1
    )
    const selectTx = await signAndSend(unsignedSelectTx, privateKey, false)
    console.log('Select call for ', hunter1, ' as winner.')
    console.log('TX ID: ', selectTx.id)
}

async function invalidHunterTest() {
    const utxoMgr = await getUtxoManager()
    let utxos = await utxoMgr.getUtxos()
    // deploy
    // constructor arguments
    const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
    const pubKey = PubKey(toHex(publicKey))
    const hunter1: Ripemd160 = Ripemd160(toByteString('01'))
    const hunter2: Ripemd160 = Ripemd160(toByteString('02'))
    const hunter3: Ripemd160 = Ripemd160(toByteString('03'))
    const hunter4: Ripemd160 = Ripemd160(toByteString('04'))
    const hunters: FixedArray<PubKeyHash, 3> = [hunter1, hunter2, hunter3]
    // create a genesis instance
    const select = new Bounty(
        pubKey,
        hunters,
        defaultOpen,
        defaultWinner
    ).markAsGenesis()
    const unsignedDeployTx = select.getDeployTx(utxos, 1)
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('Submit deploy tx:', deployTx.id)
    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)
    // fee in satoshis for `callTx`, can be estimated in local tests by calling `tx.getEstimateFee()`.
    const prevTx = deployTx
    const fee = 230
    utxos = await utxoMgr.getUtxos(fee)
    const newSelect = select.next()
    console.log('FAILS HERE')
    const unsignedSelectTx = select.getSelectTx(
        utxos,
        prevTx,
        newSelect,
        privateKey,
        hunter4
    )
    const selectTx = await signAndSend(unsignedSelectTx, privateKey, false)
    console.log('should FAIL')
    console.log('Select call for ', hunter4, ' as winner.')
    console.log('TX ID: ', selectTx.id)
}

async function invalidSignature() {
    const utxoMgr = await getUtxoManager()
    let utxos = await utxoMgr.getUtxos()
    // deploy
    // constructor arguments
    const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
    const pubKey = PubKey(toHex(publicKey))
    const hunter1: Ripemd160 = Ripemd160(toByteString('01'))
    const hunter2: Ripemd160 = Ripemd160(toByteString('02'))
    const hunter3: Ripemd160 = Ripemd160(toByteString('03'))
    const wrongPrivateKey = bsv.PrivateKey.fromRandom('testnet')
    const hunters: FixedArray<PubKeyHash, 3> = [hunter1, hunter2, hunter3]
    // create a genesis instance
    const select = new Bounty(
        pubKey,
        hunters,
        defaultOpen,
        defaultWinner
    ).markAsGenesis()
    const unsignedDeployTx = select.getDeployTx(utxos, 1)
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('Submit deploy tx:', deployTx.id)
    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)
    // fee in satoshis for `callTx`, can be estimated in local tests by calling `tx.getEstimateFee()`.
    const prevTx = deployTx
    const fee = 230
    utxos = await utxoMgr.getUtxos(fee)
    const newSelect = select.next()
    console.log('FAILS HERE')
    const unsignedSelectTx = select.getSelectTx(
        utxos,
        prevTx,
        newSelect,
        wrongPrivateKey,
        hunter2
    )
    const selectTx = await signAndSend(unsignedSelectTx, wrongPrivateKey, false)
    console.log('should FAIL')
    console.log('Select call for ', hunter2, ' as winner.')
    console.log('TX ID: ', selectTx.id)
}

async function selectTwiceTest() {
    const utxoMgr = await getUtxoManager()
    let utxos = await utxoMgr.getUtxos()
    // deploy
    // constructor arguments
    const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
    const pubKey = PubKey(toHex(publicKey))
    const hunter1: Ripemd160 = Ripemd160(toByteString('01'))
    const hunter2: Ripemd160 = Ripemd160(toByteString('02'))
    const hunter3: Ripemd160 = Ripemd160(toByteString('03'))
    const hunters: FixedArray<PubKeyHash, 3> = [hunter1, hunter2, hunter3]
    // create a genesis instance
    const select = new Bounty(
        pubKey,
        hunters,
        defaultOpen,
        defaultWinner
    ).markAsGenesis()
    const unsignedDeployTx = select.getDeployTx(utxos, 1)
    const deployTx = await signAndSend(unsignedDeployTx)
    console.log('Submit deploy tx:', deployTx.id)
    // collect the new p2pkh utxo if it exists in `deployTx`
    utxoMgr.collectUtxoFrom(deployTx)
    // fee in satoshis for `callTx`, can be estimated in local tests by calling `tx.getEstimateFee()`.
    let prevTx = deployTx
    const fee = 230
    utxos = await utxoMgr.getUtxos(fee)
    const newSelect = select.next()
    newSelect.winner = hunter1
    newSelect.open = false
    const unsignedSelectTx = select.getSelectTx(
        utxos,
        prevTx,
        newSelect,
        privateKey,
        hunter1
    )
    const selectTx = await signAndSend(unsignedSelectTx, privateKey, false)
    console.log('Select call for ', hunter1, ' as winner.')
    console.log('TX ID: ', selectTx.id)
    // second select
    prevTx = unsignedSelectTx
    utxos = await utxoMgr.getUtxos(fee)
    const newSelect2 = newSelect.next()
    console.log('FAILS HERE')
    const unsignedSelectTx2 = newSelect.getSelectTx(
        utxos,
        prevTx,
        newSelect2,
        privateKey,
        hunter2
    )
    console.log('Signing and sending')
    const selectTx2 = await signAndSend(unsignedSelectTx2, privateKey, false)
    console.log('should FAIL')
    console.log('Select call for ', hunter2, ' as winner.')
    console.log('TX ID: ', selectTx.id)
}
