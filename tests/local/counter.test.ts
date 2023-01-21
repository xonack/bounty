import { expect } from 'chai'
import { Counter } from '../../src/contracts/counter'
import { randomBytes } from 'crypto'

describe('Test SmartContract `Counter`', () => {
    before(async () => {
        await Counter.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        const utxos = [
            {
                txId: randomBytes(32).toString('hex'),
                outputIndex: 0,
                script: '', // placeholder
                satoshis: 1000,
            },
        ]

        // create a genesis instance
        const counter = new Counter(0n).markAsGenesis()
        // construct a transaction for deployment
        const deployTx = counter.getDeployTx(utxos, 1)

        let prevTx = deployTx
        let prevInstance = counter

        // multiple calls
        for (let i = 0; i < 3; i++) {
            // 1. build a new contract instance
            const newCounter = prevInstance.next()
            // 2. apply the updates on the new instance.
            newCounter.count++
            // 3. construct a transaction for contract call
            const callTx = prevInstance.getCallTx(utxos, prevTx, newCounter)
            // 4. run `verify` method on `prevInstance`
            const result = prevInstance.verify((self) => {
                self.increment()
            })

            expect(result.success, result.error).to.be.true

            // prepare for the next iteration
            prevTx = callTx
            prevInstance = newCounter
        }
    })
})
