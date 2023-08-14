import {sleep} from '../src/sleep'

describe('sleep', () => {
    it('should resolve after a specified delay', async () => {
        const delay = 1000 // Delay in milliseconds

        const sleepPromise = sleep(delay)

        // Fast-forward time
        jest.advanceTimersByTime(delay)

        await expect(sleepPromise).resolves.toBeUndefined()
    })
})
