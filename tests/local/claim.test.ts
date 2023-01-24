import { Bounty } from '../../src/contracts/bounty'
import { expect } from 'chai'
import { dummyUTXO, newTx, inputIndex, inputSatoshis } from './util/txHelper'
import {
    bsv,
    FixedArray,
    hash160,
    PubKey,
    PubKeyHash,
    Ripemd160,
    Sig,
    signTx,
    toByteString,
    toHex,
} from 'scrypt-ts'

const privateKey = bsv.PrivateKey.fromRandom('testnet')
const publicKey = privateKey.publicKey
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

describe('Test `Claim` SmartContract', () => {
    before(async () => {
        await Bounty.compile()
    })

    it('pass - valid bounty claim', async () => {
        await validWinnerTest()
    })

    it('fail - invalid bounty claim', async () => {
        await invalidSigAndPubKeyTest()
    })

    it('fail - invalid public key', async () => {
        await invalidPubKeyTest()
    })

    it('fail - invalid signature', async () => {
        await invalidSignatureTest()
    })

    it('fail - bounty still open', async () => {
        await bountyOpenTest()
    })
})

async function validWinnerTest() {
    // new instance
    const instance = new Bounty(pubKey, emptyHunters, false, winnerPKH)
    // unlockFrom for stateful contract
    dummyUTXO.script = instance.lockingScript.toHex()
    const utxos = [dummyUTXO]
    const tx = newTx(utxos)
    instance.unlockFrom = { tx, inputIndex }
    // instance.verify
    const result = instance.verify((self) => {
        const sig = signTx(
            tx,
            winnerPrivateKey,
            self.lockingScript,
            inputSatoshis
        )
        self.claim(Sig(toHex(sig)), winnerPubKey)
    })
    // expect result
    expect(result.success, result.error).to.be.true
}

async function invalidPubKeyTest() {
    // new instance
    const instance = new Bounty(pubKey, emptyHunters, false, winnerPKH)
    // unlockFrom for stateful contract
    dummyUTXO.script = instance.lockingScript.toHex()
    const utxos = [dummyUTXO]
    const tx = newTx(utxos)
    instance.unlockFrom = { tx, inputIndex }
    // expect assertion error
    const invalidPrivateKey = bsv.PrivateKey.fromRandom('testnet')
    const invalidPublicKey = bsv.PublicKey.fromPrivateKey(invalidPrivateKey)
    const invalidPubKey = PubKey(toHex(invalidPublicKey))
    expect(() => {
        instance.verify(() => {
            const sig = signTx(
                tx,
                privateKey,
                instance.lockingScript,
                inputSatoshis
            )
            instance.claim(Sig(toHex(sig)), invalidPubKey)
        })
    }).to.throw(/Execution failed/)
}

async function invalidSignatureTest() {
    // new instance
    const instance = new Bounty(pubKey, emptyHunters, false, winnerPKH)
    // unlockFrom for stateful contract
    dummyUTXO.script = instance.lockingScript.toHex()
    const utxos = [dummyUTXO]
    const tx = newTx(utxos)
    instance.unlockFrom = { tx, inputIndex }
    // expect assertion error
    const invalidPrivateKey = bsv.PrivateKey.fromRandom('testnet')
    expect(() => {
        instance.verify(() => {
            const invalidSig = signTx(
                tx,
                invalidPrivateKey,
                instance.lockingScript,
                inputSatoshis
            )
            instance.claim(Sig(toHex(invalidSig)), pubKey)
        })
    }).to.throw(/Execution failed/)
}

async function invalidSigAndPubKeyTest() {
    // new instance
    const instance = new Bounty(pubKey, emptyHunters, false, winnerPKH)
    // unlockFrom for stateful contract
    dummyUTXO.script = instance.lockingScript.toHex()
    const utxos = [dummyUTXO]
    const tx = newTx(utxos)
    instance.unlockFrom = { tx, inputIndex }
    // expect assertion error
    const invalidPrivateKey = bsv.PrivateKey.fromRandom('testnet')
    const invalidPublicKey = bsv.PublicKey.fromPrivateKey(invalidPrivateKey)
    const invalidPubKey = PubKey(toHex(invalidPublicKey))
    expect(() => {
        instance.verify(() => {
            const invalidSig = signTx(
                tx,
                invalidPrivateKey,
                instance.lockingScript,
                inputSatoshis
            )
            instance.claim(Sig(toHex(invalidSig)), invalidPubKey)
        })
    }).to.throw(/Execution failed/)
}

async function bountyOpenTest() {
    // new instance
    const instance = new Bounty(
        pubKey,
        emptyHunters,
        true,
        Ripemd160(toByteString('00'))
    )
    // unlockFrom for stateful contract
    dummyUTXO.script = instance.lockingScript.toHex()
    const utxos = [dummyUTXO]
    const tx = newTx(utxos)
    instance.unlockFrom = { tx, inputIndex }
    // expect assertion error
    expect(() => {
        instance.verify(() => {
            const sig = signTx(
                tx,
                privateKey,
                instance.lockingScript,
                inputSatoshis
            )
            instance.claim(Sig(toHex(sig)), pubKey)
        })
    }).to.throw(/Execution failed/)
}
