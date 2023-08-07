/* eslint-disable no-inner-declarations */
import {Octokit} from '@octokit/core'
import * as core from '@actions/core'
import S3, {PutObjectRequest} from 'aws-sdk/clients/s3'
import * as fs from 'fs'
import * as https from 'https'
import 'dotenv/config'

// All the GitHub variables
const githubOrganization: string = process.env.GH_ORG as string
const githubRepository: string = process.env.GH_REPO as string
const octokit = new Octokit({
    auth: process.env.GH_APIKEY
})

// All the AWS variables
const bucketName: string = process.env.AWS_BUCKET_NAME as string
const region: string = process.env.AWS_BUCKET_REGION as string
const accessKeyId: string = process.env.AWS_ACCESS_KEY as string
const secretAccessKey: string = process.env.AWS_SECRET_KEY as string
const s3 = new S3({region, accessKeyId, secretAccessKey})

// Check if all the variables necessary are defined
export function check(
    githubOrganization: string,
    githubRepository: string,
    bucketName: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string
): void {
    if (!githubOrganization) {
        throw new Error('GH_ORG is undefined')
    }

    if (!githubRepository) {
        throw new Error('GH_REPO is undefined')
    }

    if (!bucketName) {
        throw new Error('AWS_BUCKET_NAME is undefined')
    }

    if (!region) {
        throw new Error('AWS_BUCKET_REGION is undefined')
    }

    if (!accessKeyId) {
        throw new Error('AWS_ACCESS_KEY is undefined')
    }

    if (!secretAccessKey) {
        throw new Error('AWS_SECRET_KEY is undefined')
    }
}

// Add sleep function to reduce calls to GitHub API when checking the status of the migration
async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function getRepoNames(organization: string): Promise<string[]> {
    console.log('Get list of repositories...')

    let repoNames: string[] = []
    let fetchMore = true
    let page = 1
    const n_results = 10

    // Fetch all repositories that currently exist within the org
    while (fetchMore) {
        const repos = await octokit.request('GET /orgs/{org}/repos', {
            org: organization,
            type: 'all',
            per_page: n_results,
            sort: 'full_name',
            page: page++
        })
        repoNames = repoNames.concat(repos.data.map(item => item.full_name))
        fetchMore = repos.data.length >= n_results
    }
    return repoNames
}

// Main function for running the migration
async function run(organization: string): Promise<void> {
    try {
        // Fetch repo names asynchronously
        const repoNames = await getRepoNames(organization)

        console.log(repoNames)

        console.log('Starting migration...')

        // Start the migration on GitHub
        const migration = await octokit.request('POST /orgs/{org}/migrations', {
            org: organization,
            repositories: repoNames,
            lock_repositories: false
        })

        console.log(
            `Migration started successfully! \nThe current migration id is ${migration.data.id} and the state is currently on ${migration.data.state}`
        )

        // TODO RUNNER TAKEN OPSPLITSEN VANAF HIER <---->

        // REMOVE IN FUTURE --->
        // Need a migration status when entering the while loop for the first time
        let state = migration.data.state

        // Wait for status of migration to be exported
        while (state !== 'exported') {
            const check = await octokit.request(
                'GET /orgs/{org}/migrations/{migration_id}',
                {
                    org: organization,
                    migration_id: migration.data.id
                }
            )
            console.log(`State is ${check.data.state}... \n`)
            state = check.data.state
            await sleep(5000)
        }

        console.log(
            `State changed to ${state}! \nRequesting download url of archive...\n`
        )
        // REMOVE IN FUTURE <---

        // Fetches the URL to a migration archive
        const archive = await octokit.request(
            'GET /orgs/{org}/migrations/{migration_id}/archive',
            {
                org: organization,
                migration_id: migration.data.id
            }
        )

        console.log(archive.url)

        // Function for uploading archive to our own S3 Bucket
        async function uploadArchive(filename: string): Promise<unknown> {
            console.log('Uploading archive to our own S3 bucket')
            const fileStream = fs.createReadStream(filename)
            const uploadParams: PutObjectRequest = {
                Bucket: bucketName,
                Body: fileStream,
                Key: filename
            }

            // this will upload the archive to S3
            return s3.upload(uploadParams).promise()
        }

        // Function for deleting archive from Github
        async function deleteArchive(
            organization: string,
            migrationId: number
        ): Promise<void> {
            console.log('Deleting organization migration archive from GitHub')
            await octokit.request(
                'DELETE /orgs/{org}/migrations/{migration_id}/archive',
                {
                    org: organization,
                    migration_id: migrationId
                }
            )
        }

        // Function for downloading archive from Github S3 environment
        function downloadArchive(url: string, filename: string): void {
            https.get(url, res => {
                const writeStream = fs.createWriteStream(filename)
                console.log('\nDownloading archive file...')
                res.pipe(writeStream)

                writeStream.on('finish', () => {
                    console.log('Download completed!')
                    // Upload archive to our own S3 Bucket
                    uploadArchive(filename)
                    // Deletes the migration archive. Migration archives are otherwise automatically deleted after seven days.
                deleteArchive(organization, migration.data.id)
                console.log('Backup completed! Goodbye.')
            })

                writeStream.on('error', () => {
                    console.log('Error while downloading file')
                })
            })
        }

        // Create a name for the file which has the current date attached to it
        const filename = `gh_org_archive_${githubOrganization}_${new Date()
            .toJSON()
            .slice(0, 10)}.tar.gz`

        // Download archive from Github and upload it to our own S3 bucket
        downloadArchive(archive.url, filename)
    } catch (error) {
        console.error('Error occurred during migration:', error)
    }
}

// Check if all variables are defined
check(
    githubOrganization,
    githubRepository,
    bucketName,
    region,
    accessKeyId,
    secretAccessKey
)

// Start the backup script
run(githubOrganization)
