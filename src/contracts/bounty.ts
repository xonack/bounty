import {
    assert,
    bsv,
    ByteString,
    FixedArray,
    hash160,
    hash256,
    method,
    prop,
    PubKey,
    PubKeyHash,
    Ripemd160,
    Sig,
    SmartContract,
    toByteString,
    toHex,
    utf8ToByteString,
} from 'scrypt-ts'
import { UTXO } from '../types'

export class Bounty extends SmartContract {
    private balance: number

    @prop()
    maker: PubKey

    @prop(true)
    hunters: FixedArray<PubKeyHash, 3>

    @prop(true)
    submissions: FixedArray<ByteString, 3>

    @prop(true)
    submissionCount: bigint

    @prop(true)
    open: boolean

    @prop(true)
    winner: PubKeyHash

    constructor(
        maker: PubKey,
        hunters: FixedArray<PubKeyHash, 3>,
        open: boolean,
        winner: PubKeyHash
    ) {
        super(maker, hunters, open, winner)

        this.maker = maker
        this.hunters = hunters
        this.open = open
        this.winner = winner

        // this.open = false
        // this.winner = Ripemd160(toByteString('00'))

        this.submissionCount = 0n
        this.submissions = [
            utf8ToByteString('0'),
            utf8ToByteString('0'),
            utf8ToByteString('0'),
        ]
    }

    @method()
    public submit(hunter: PubKeyHash, submissionContent: ByteString) {
        assert(this.open, "can't submit to a closed bounty")
        assert(
            hash160(this.maker) != hunter,
            "you can't submit contnent to your own bouty"
        )
        assert(this.submissionCount < 3, 'submission limit exceeded')
        // guarantee new hunter
        let newHunter = true
        for (let i = 0; i < 3; i++) {
            if (this.hunters[i] === hunter) {
                newHunter = false
            }
        }
        assert(newHunter, 'cannot submit to the same bounty twice')
        this.hunters[Number(this.submissionCount)] = hunter
        this.submissions[Number(this.submissionCount)] = submissionContent
        this.submissionCount++
        assert(
            this.ctx.hashOutputs ==
                hash256(this.buildStateOutput(this.ctx.utxo.value)),
            'pay for transaction'
        )
    }

    @method()
    public select(sig: Sig, winner: PubKeyHash) {
        assert(
            winner != Ripemd160(toByteString('00')),
            "cannot select nullHunter (Ripemd160(toByteString('00'))) as winner"
        )
        assert(this.open, 'can`t select winner for closed bounty')
        assert(this.checkSig(sig, this.maker), 'signature check failed')
        let isHunter = false
        for (let i = 0; i < 3; i++) {
            if (this.hunters[i] === winner) {
                isHunter = true
            }
        }
        assert(
            isHunter,
            'selected winner did not submit content for the bounty'
        )
        this.winner = winner
        this.open = false
        assert(!this.open, 'bounty failed to close')
    }

    @method()
    public claim(sig: Sig, pubKey: PubKey) {
        assert(!this.open, "can't claim open bounty")
        assert(
            hash160(pubKey) == this.winner,
            'public key was not selected as winner'
        )
        assert(this.checkSig(sig, pubKey), 'signature check failed')
    }

    getDeployTx(utxos: UTXO[], initBalance: number): bsv.Transaction {
        this.balance = initBalance
        const tx = new bsv.Transaction().from(utxos).addOutput(
            new bsv.Transaction.Output({
                script: this.lockingScript,
                satoshis: initBalance,
            })
        )
        this.lockTo = { tx, outputIndex: 0 }
        return tx
    }

    getSubmitTx(
        utxos: UTXO[],
        prevTx: bsv.Transaction,
        nextInst: Bounty,
        hunter: PubKeyHash,
        submission: ByteString
    ): bsv.Transaction {
        const inputIndex = 1
        return new bsv.Transaction()
            .from(utxos)
            .addInputFromPrevTx(prevTx)
            .setOutput(0, (tx: bsv.Transaction) => {
                nextInst.lockTo = { tx, outputIndex: 0 }
                return new bsv.Transaction.Output({
                    script: nextInst.lockingScript,
                    satoshis: this.balance,
                })
            })
            .setInputScript(inputIndex, (tx: bsv.Transaction) => {
                this.unlockFrom = { tx, inputIndex }
                return this.getUnlockingScript((self) => {
                    self.submit(hunter, submission)
                })
            })
    }

    getSelectTx(
        utxos: UTXO[],
        prevTx: bsv.Transaction,
        nextInst: Bounty,
        privateKey: bsv.PrivateKey,
        winner: PubKeyHash
    ): bsv.Transaction {
        const inputIndex = 1
        return new bsv.Transaction()
            .from(utxos)
            .addInputFromPrevTx(prevTx)
            .setOutput(0, (tx: bsv.Transaction) => {
                nextInst.lockTo = { tx, outputIndex: 0 }
                return new bsv.Transaction.Output({
                    script: nextInst.lockingScript,
                    satoshis: this.balance,
                })
            })
            .setInputScript(
                {
                    inputIndex,
                    privateKey,
                },
                (tx: bsv.Transaction) => {
                    this.unlockFrom = { tx, inputIndex }
                    return this.getUnlockingScript((self) => {
                        self.select(
                            Sig(tx.getSignature(inputIndex) as string),
                            winner
                        )
                    })
                }
            )
    }

    getClaimTx(
        pubKey: bsv.PublicKey,
        privateKey: bsv.PrivateKey,
        prevTx: bsv.Transaction
    ): bsv.Transaction {
        const inputIndex = 0
        return new bsv.Transaction().addInputFromPrevTx(prevTx).setInputScript(
            {
                inputIndex,
                privateKey,
            },
            (tx) => {
                const sig = tx.getSignature(inputIndex)
                this.unlockFrom = { tx, inputIndex }
                return this.getUnlockingScript((self) => {
                    self.claim(Sig(sig as string), PubKey(toHex(pubKey)))
                })
            }
        )
    }
}
