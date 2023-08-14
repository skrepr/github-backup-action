import {expect} from '@jest/globals'

import {checkEnv} from '../src/check' // Update this with the correct path to your module

describe('checkEnv', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeAll(() => {
        originalEnv = process.env
    })

    afterEach(() => {
        process.env = originalEnv // Restore original process.env after each test
    })

    it('throws an error when required variables are missing', () => {
        // Set an empty environment to simulate missing variables
        process.env = {}

        expect(() => {
            checkEnv()
        }).toThrowError('GH_ORG is undefined')
    })

    it('does not throw an error when all required variables are defined', () => {
        // Set mock values for required variables
        process.env = {
            GH_ORG: 'myorg',
            GH_API_KEY: 'apikey',
            AWS_BUCKET_NAME: 'bucket',
            AWS_BUCKET_REGION: 'region',
            AWS_ACCESS_KEY: 'accesskey',
            AWS_SECRET_KEY: 'secretkey'
        }

        expect(() => {
            checkEnv()
        }).not.toThrow()
    })
})
