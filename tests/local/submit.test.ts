import { expect } from 'chai'
import { Bounty } from '../../src/contracts/bounty'
import { dummyUTXO, newTx } from './util/txHelper'
import {
    bsv,
    ByteString,
    FixedArray,
    hash160,
    PubKey,
    PubKeyHash,
    Ripemd160,
    toByteString,
    toHex,
    utf8ToByteString,
} from 'scrypt-ts'

const privateKey = bsv.PrivateKey.fromRandom('testnet')
const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
const pubKey = PubKey(toHex(publicKey))
const pkh: PubKeyHash = PubKeyHash(hash160(pubKey))

const defaultOpen = true
const nullWinner = Ripemd160(toByteString('00'))

//TODO: simplify with loops
describe('Test SmartContract `Submit`', () => {
    before(async () => {
        await Bounty.compile() // asm
    })

    it('pass - one submit', async () => {
        await testOneSubmit()
    })

    it('pass - two submits', async () => {
        await testTwoSubmit()
    })

    it('pass - three submits', async () => {
        await testThreeSubmit()
    })

    it('fail - four submits (exceeded max submissions)', async () => {
        await testFourSubmit()
    })

    it('fail - maker submits content', async () => {
        await testMakerSubmit()
    })

    it('fail - hunter submits twice', async () => {
        await testMakerSubmit()
    })
})

async function testOneSubmit() {
    // expect(result.success).to.be.true
    const utxos = [dummyUTXO]
    // create a genesis instance
    const emptyHunters: FixedArray<PubKeyHash, 3> = [
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    const instance = new Bounty(
        pubKey,
        emptyHunters,
        defaultOpen,
        nullWinner
    ).markAsGenesis()
    // construct a transaction for deployment
    const deployTx = instance.getDeployTx(utxos, 1)

    // 1
    // 1. build a new contract instance
    const nextInstance = instance.next()
    // 2. apply the updates on the new instance.
    const hunter1: Ripemd160 = Ripemd160(toByteString('01'))
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
    const callTx1 = instance.getSubmitTx(
        utxos,
        deployTx,
        nextInstance,
        hunter1,
        submission1
    )
    // 4. run `verify` method
    const result = instance.verify((self) => {
        self.submit(hunter1, submission1)
    })
    expect(result.success, result.error).to.be.true
}

async function testTwoSubmit() {
    // expect(result.success).to.be.true
    const utxos = [dummyUTXO]
    // create a genesis instance
    const emptyHunters: FixedArray<PubKeyHash, 3> = [
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    let instance = new Bounty(
        pubKey,
        emptyHunters,
        defaultOpen,
        nullWinner
    ).markAsGenesis()
    // construct a transaction for deployment
    const deployTx = instance.getDeployTx(utxos, 1)
    let prevTx = deployTx
    // 1
    // 1. build a new contract instance
    let newInstance = instance.next()
    // 2. apply the updates on the new instance.
    const hunter1: Ripemd160 = Ripemd160(toByteString('01'))
    const submission1: ByteString = utf8ToByteString('submission1')
    let hunters: FixedArray<PubKeyHash, 3> = [
        hunter1,
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    let submissions: FixedArray<ByteString, 3> = [
        submission1,
        utf8ToByteString('0'),
        utf8ToByteString('0'),
    ]
    newInstance.hunters = hunters
    newInstance.submissions = submissions
    newInstance.submissionCount = 1n
    // 3. construct a transaction for contract call
    const callTx1 = instance.getSubmitTx(
        utxos,
        prevTx,
        newInstance,
        hunter1,
        submission1
    )
    // 4. run `verify` method on `prevInstance`
    const result1 = instance.verify((self) => {
        self.submit(hunter1, submission1)
    })
    expect(result1.success, result1.error).to.be.true
    // prepare for the next iteration
    prevTx = callTx1
    instance = newInstance

    // // 2
    newInstance = instance.next()
    // set new submission
    const hunter2: Ripemd160 = Ripemd160(toByteString('02'))
    const submission2: ByteString = utf8ToByteString('submission2')
    hunters = [hunter1, hunter2, Ripemd160(toByteString('00'))]
    submissions = [submission1, submission2, utf8ToByteString('0')]
    newInstance.hunters = hunters
    newInstance.submissions = submissions
    newInstance.submissionCount = 2n
    const callTx2 = instance.getSubmitTx(
        utxos,
        prevTx,
        newInstance,
        hunter2,
        submission2
    )
    const result2 = instance.verify((self) => {
        self.submit(hunter2, submission2)
    })
    expect(result2.success, result2.error).to.be.true
}

async function testThreeSubmit() {
    // expect(result.success).to.be.true
    const utxos = [dummyUTXO]
    // create a genesis instance
    const emptyHunters: FixedArray<PubKeyHash, 3> = [
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    let instance = new Bounty(
        pubKey,
        emptyHunters,
        defaultOpen,
        nullWinner
    ).markAsGenesis()
    // construct a transaction for deployment
    const deployTx = instance.getDeployTx(utxos, 1)
    let prevTx = deployTx
    // 1
    // 1. build a new contract instance
    let newInstance = instance.next()
    // 2. apply the updates on the new instance.
    const hunter1: Ripemd160 = Ripemd160(toByteString('01'))
    const submission1: ByteString = utf8ToByteString('submission1')
    let hunters: FixedArray<PubKeyHash, 3> = [
        hunter1,
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    let submissions: FixedArray<ByteString, 3> = [
        submission1,
        utf8ToByteString('0'),
        utf8ToByteString('0'),
    ]
    newInstance.hunters = hunters
    newInstance.submissions = submissions
    newInstance.submissionCount = 1n
    // 3. construct a transaction for contract call
    const callTx1 = instance.getSubmitTx(
        utxos,
        prevTx,
        newInstance,
        hunter1,
        submission1
    )
    // 4. run `verify` method on `prevInstance`
    const result1 = instance.verify((self) => {
        self.submit(hunter1, submission1)
    })
    expect(result1.success, result1.error).to.be.true
    // prepare for the next iteration
    prevTx = callTx1
    instance = newInstance

    // // 2
    newInstance = instance.next()
    // set new submission
    const hunter2: Ripemd160 = Ripemd160(toByteString('02'))
    const submission2: ByteString = utf8ToByteString('submission2')
    hunters = [hunter1, hunter2, Ripemd160(toByteString('00'))]
    submissions = [submission1, submission2, utf8ToByteString('0')]
    newInstance.hunters = hunters
    newInstance.submissions = submissions
    newInstance.submissionCount = 2n
    const callTx2 = instance.getSubmitTx(
        utxos,
        prevTx,
        newInstance,
        hunter2,
        submission2
    )
    const result2 = instance.verify((self) => {
        self.submit(hunter2, submission2)
    })
    expect(result2.success, result2.error).to.be.true
    // prepare for the next iteration
    prevTx = callTx2
    instance = newInstance

    // // 3
    const newSubmit3 = instance.next()
    const hunter3: Ripemd160 = Ripemd160(toByteString('03'))
    const submission3: ByteString = utf8ToByteString('submission3')
    // set new submission
    hunters = [hunter1, hunter2, hunter3]
    submissions = [submission1, submission2, submission3]
    newSubmit3.hunters = hunters
    newSubmit3.submissions = submissions
    newSubmit3.submissionCount = 3n
    const callTx3 = instance.getSubmitTx(
        utxos,
        prevTx,
        newSubmit3,
        hunter3,
        submission3
    )
    const result3 = instance.verify((self) => {
        self.submit(hunter3, submission3)
    })
    expect(result3.success, result3.error).to.be.true
}

async function testFourSubmit() {
    // expect(result.success).to.be.true
    const utxos = [dummyUTXO]
    // create a genesis instance
    const emptyHunters: FixedArray<PubKeyHash, 3> = [
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    let instance = new Bounty(
        pubKey,
        emptyHunters,
        defaultOpen,
        nullWinner
    ).markAsGenesis()
    // construct a transaction for deployment
    const deployTx = instance.getDeployTx(utxos, 1)
    let prevTx = deployTx
    // 1
    // 1. build a new contract instance
    let newInstance = instance.next()
    // 2. apply the updates on the new instance.
    const hunter1: Ripemd160 = Ripemd160(toByteString('01'))
    const submission1: ByteString = utf8ToByteString('submission1')
    let hunters: FixedArray<PubKeyHash, 3> = [
        hunter1,
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    let submissions: FixedArray<ByteString, 3> = [
        submission1,
        utf8ToByteString('0'),
        utf8ToByteString('0'),
    ]
    newInstance.hunters = hunters
    newInstance.submissions = submissions
    newInstance.submissionCount = 1n
    // 3. construct a transaction for contract call
    const callTx1 = instance.getSubmitTx(
        utxos,
        prevTx,
        newInstance,
        hunter1,
        submission1
    )
    // 4. run `verify` method on `prevInstance`
    const result1 = instance.verify((self) => {
        self.submit(hunter1, submission1)
    })
    expect(result1.success, result1.error).to.be.true
    // prepare for the next iteration
    prevTx = callTx1
    instance = newInstance

    // // 2
    newInstance = instance.next()
    // set new submission
    const hunter2: Ripemd160 = Ripemd160(toByteString('02'))
    const submission2: ByteString = utf8ToByteString('submission2')
    hunters = [hunter1, hunter2, Ripemd160(toByteString('00'))]
    submissions = [submission1, submission2, utf8ToByteString('0')]
    newInstance.hunters = hunters
    newInstance.submissions = submissions
    newInstance.submissionCount = 2n
    const callTx2 = instance.getSubmitTx(
        utxos,
        prevTx,
        newInstance,
        hunter2,
        submission2
    )
    const result2 = instance.verify((self) => {
        self.submit(hunter2, submission2)
    })
    expect(result2.success, result2.error).to.be.true
    // prepare for the next iteration
    prevTx = callTx2
    instance = newInstance

    // // 3
    newInstance = instance.next()
    const hunter3: Ripemd160 = Ripemd160(toByteString('03'))
    const submission3: ByteString = utf8ToByteString('submission3')
    // set new submission
    hunters = [hunter1, hunter2, hunter3]
    submissions = [submission1, submission2, submission3]
    newInstance.hunters = hunters
    newInstance.submissions = submissions
    newInstance.submissionCount = 3n
    const callTx3 = instance.getSubmitTx(
        utxos,
        prevTx,
        newInstance,
        hunter3,
        submission3
    )
    const result3 = instance.verify((self) => {
        self.submit(hunter3, submission3)
    })
    expect(result3.success, result3.error).to.be.true
    // prepare for the next iteration
    prevTx = callTx3
    instance = newInstance

    // // 4 max submissions reached --> FAILS
    const newSubmit4 = instance.next()
    const hunter4 = Ripemd160(toByteString('04'))
    const submission4 = submission1

    expect(() => {
        newSubmit4.submit(hunter4, submission4)
    }).to.throw(/Execution failed/)
}

async function testMakerSubmit() {
    // expect(result.success).to.be.true
    const utxos = [dummyUTXO]
    // create a genesis instance
    const emptyHunters: FixedArray<PubKeyHash, 3> = [
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    const instance = new Bounty(
        pubKey,
        emptyHunters,
        defaultOpen,
        nullWinner
    ).markAsGenesis()
    // construct a transaction for deployment
    const deployTx = instance.getDeployTx(utxos, 1)

    // 1
    // 1. build a new contract instance
    const nextInstance = instance.next()
    // 2. apply the updates on the new instance.
    const makerHunter: Ripemd160 = pkh
    const submission: ByteString = utf8ToByteString('submission1')
    const hunters: FixedArray<PubKeyHash, 3> = [
        makerHunter,
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]
    const submissions: FixedArray<ByteString, 3> = [
        submission,
        utf8ToByteString('0'),
        utf8ToByteString('0'),
    ]
    nextInstance.hunters = hunters
    nextInstance.submissions = submissions
    nextInstance.submissionCount = 1n

    expect(() => {
        instance.getSubmitTx(
            utxos,
            deployTx,
            nextInstance,
            makerHunter,
            submission
        )
        instance.submit(makerHunter, submission)
    }).to.throw(/Execution failed, you can't submit contnent to your own bouty/)
}

async function testDoubleSubmit() {
    // expect(result.success).to.be.true
    const utxos = [dummyUTXO]
    // create a genesis instance
    const hunter = Ripemd160(toByteString('01'))
    const hunters: FixedArray<PubKeyHash, 3> = [
        hunter,
        Ripemd160(toByteString('00')),
        Ripemd160(toByteString('00')),
    ]

    const instance = new Bounty(
        pubKey,
        hunters,
        defaultOpen,
        nullWinner
    ).markAsGenesis()
    // construct a transaction for deployment
    const deployTx = instance.getDeployTx(utxos, 1)

    // 1
    // 1. build a new contract instance
    const nextInstance = instance.next()
    // 2. apply the updates on the new instance.
    const submission: ByteString = utf8ToByteString('submission1')

    const submissions: FixedArray<ByteString, 3> = [
        submission,
        utf8ToByteString('0'),
        utf8ToByteString('0'),
    ]
    nextInstance.hunters = hunters
    nextInstance.submissions = submissions
    nextInstance.submissionCount = 1n

    expect(() => {
        instance.getSubmitTx(utxos, deployTx, nextInstance, hunter, submission)
        instance.submit(hunter, submission)
    }).to.throw(/Execution failed, cannot submit twice to the same bounty/)
}
