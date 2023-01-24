import { Bounty } from '../../src/contracts/bounty'
import { expect } from 'chai'
import { dummyUTXO, inputSatoshis, newTx } from './util/txHelper'
import {
    bsv,
    ByteString,
    FixedArray,
    hash160,
    PubKey,
    PubKeyHash,
    Ripemd160,
    Sig,
    signTx,
    toByteString,
    toHex,
    utf8ToByteString,
} from 'scrypt-ts'

// SET UP
const privateKey = bsv.PrivateKey.fromRandom('testnet')
const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
const pubKey = PubKey(toHex(publicKey))
const pkh: PubKeyHash = PubKeyHash(hash160(pubKey))

const winnerPrivateKey = bsv.PrivateKey.fromRandom('testnet')
const winnerPublicKey = winnerPrivateKey.publicKey
const winnerPubKey = PubKey(toHex(winnerPublicKey))
const winnerPKH: PubKeyHash = PubKeyHash(hash160(winnerPubKey))

const emptyHunters: FixedArray<PubKeyHash, 3> = [
    Ripemd160(toByteString('00')),
    Ripemd160(toByteString('00')),
    Ripemd160(toByteString('00')),
]
const defaultOpen = true
const nullWinner = Ripemd160(toByteString('00'))

// TEST FUNCTIONS
async function testBountyLifecycle() {
    // create bounty
    const utxos = [dummyUTXO]
    // create a genesis instance
    let instance = new Bounty(
        pubKey,
        emptyHunters,
        defaultOpen,
        nullWinner
    ).markAsGenesis()
    // construct a transaction for deployment
    const deployTx = instance.getDeployTx(utxos, 1)

    // 1 - submit
    // 1. build a new contract instance
    let nextInstance = instance.next()
    // 2. apply the updates on the new instance.
    const hunter1: Ripemd160 = winnerPKH
    const submission1: ByteString = utf8ToByteString('submission1')
    const hunters: FixedArray<PubKeyHash, 3> = [
        hunter1,
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    const submissions: FixedArray<ByteString, 3> = [
        submission1,
        utf8ToByteString('0'),
        utf8ToByteString('0'),
    ]
    nextInstance.hunters = hunters
    nextInstance.submissions = submissions
    nextInstance.submissionCount = 1n
    // 3. construct a transaction for contract call
    const submitTx = instance.getSubmitTx(
        utxos,
        deployTx,
        nextInstance,
        hunter1,
        submission1
    )
    const submitResult = instance.verify((self) => {
        self.submit(hunter1, submission1)
    })
    expect(submitResult.success, submitResult.error).to.be.true

    instance = nextInstance
    // 2 - select
    const selectInputIndex = 1
    nextInstance = instance.next()
    nextInstance.winner = hunter1
    nextInstance.open = false
    const selectTx = instance.getSelectTx(
        utxos,
        submitTx,
        nextInstance,
        privateKey,
        hunter1
    )

    const selectResult = instance.verify((self) => {
        self.select(
            Sig(selectTx.getSignature(selectInputIndex) as string),
            hunter1
        )
    })
    expect(selectResult.success, selectResult.error).to.be.true

    instance = nextInstance
    // 3 - claim
    const claimInputIndex = 0
    nextInstance = instance.next()
    const claimTx = instance.getClaimTx(
        winnerPublicKey,
        winnerPrivateKey,
        selectTx
    )
    const claimResult = instance.verify((self) => {
        self.claim(
            Sig(claimTx.getSignature(claimInputIndex) as string),
            winnerPubKey
        )
    })
    expect(claimResult.success, claimResult.error).to.be.true
}

// RUN TESTS
describe('Test Bounty Lifecycle', () => {
    before(async () => {
        await Bounty.compile()
    })

    it('pass - submit, select, claim', async () => {
        await testBountyLifecycle()
    })

    // TODO
    // bounty closed
    // it('fail - submit after selct', async () => {
    //     await testMaxBountyLifecycle()
    // })

    // fail - select null hunter as winner
})
