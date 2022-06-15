import {check} from '../src/main'
import {expect, test} from '@jest/globals'

test('check for undefined variable in githubOrganization', () => {
    let githubOrganization: string = '' as string
    let githubRepository: string = 'repo' as string
    let bucketName: string = 'bucket_name' as string
    let region: string = 'region' as string
    let accessKeyId: string = 'access_key' as string
    let secretAccessKey: string = 'secret_key' as string

    expect(() =>
        check(
            githubOrganization,
            githubRepository,
            bucketName,
            region,
            accessKeyId,
            secretAccessKey
        )
    ).toThrow('GH_ORG is undefined')
})

test('check for undefined variable in githubRepository', () => {
    let githubOrganization: string = 'org' as string
    let githubRepository: string = '' as string
    let bucketName: string = 'bucket_name' as string
    let region: string = 'region' as string
    let accessKeyId: string = 'access_key' as string
    let secretAccessKey: string = 'secret_key' as string

    expect(() =>
        check(
            githubOrganization,
            githubRepository,
            bucketName,
            region,
            accessKeyId,
            secretAccessKey
        )
    ).toThrow('GH_REPO is undefined')
})

test('check for undefined variable in bucketName', () => {
    let githubOrganization: string = 'org' as string
    let githubRepository: string = 'repo' as string
    let bucketName: string = '' as string
    let region: string = 'region' as string
    let accessKeyId: string = 'access_key' as string
    let secretAccessKey: string = 'secret_key' as string

    expect(() =>
        check(
            githubOrganization,
            githubRepository,
            bucketName,
            region,
            accessKeyId,
            secretAccessKey
        )
    ).toThrow('BUCKET_NAME is undefined')
})

test('check for undefined variable in region', () => {
    let githubOrganization: string = 'org' as string
    let githubRepository: string = 'repo' as string
    let bucketName: string = 'bucket_name' as string
    let region: string = '' as string
    let accessKeyId: string = 'access_key' as string
    let secretAccessKey: string = 'secret_key' as string

    expect(() =>
        check(
            githubOrganization,
            githubRepository,
            bucketName,
            region,
            accessKeyId,
            secretAccessKey
        )
    ).toThrow('AWS_BUCKET_REGION is undefined')
})

test('check for undefined variable in accessKeyId', () => {
    let githubOrganization: string = 'org' as string
    let githubRepository: string = 'repo' as string
    let bucketName: string = 'bucket_name' as string
    let region: string = 'region' as string
    let accessKeyId: string = '' as string
    let secretAccessKey: string = 'secret_key' as string

    expect(() =>
        check(
            githubOrganization,
            githubRepository,
            bucketName,
            region,
            accessKeyId,
            secretAccessKey
        )
    ).toThrow('AWS_ACCESS_KEY is undefined')
})

test('check for undefined variable in secretAccessKey', () => {
    let githubOrganization: string = 'org' as string
    let githubRepository: string = 'repo' as string
    let bucketName: string = 'bucket_name' as string
    let region: string = 'region' as string
    let accessKeyId: string = 'access_key' as string
    let secretAccessKey: string = '' as string

    expect(() =>
        check(
            githubOrganization,
            githubRepository,
            bucketName,
            region,
            accessKeyId,
            secretAccessKey
        )
    ).toThrow('AWS_SECRET_KEY is undefined')
})
