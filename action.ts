import { Octokit } from '@octokit/core';
import S3, { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import * as https from 'https';

// Will read out all the environment variables in $ENV or .env
require('dotenv').config();

// All the GitHub variables
const githubOrganization = process.env.GH_ORG;
const githubRepository = process.env.GH_REPO;
const octokit = new Octokit({
    auth: process.env.GH_APIKEY
});

// All the AWS variables
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const s3 = new S3({  region,  accessKeyId,  secretAccessKey});

// Check if all the variables necessary are defined
if (!githubOrganization) {
    throw new Error('GH_ORG is undefined');
}

if (!githubRepository) {
    throw new Error('GH_REPO is undefined');
}

if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is undefined');
}

if (!region) {
    throw new Error('AWS_BUCKET_REGION is undefined');
}

if (!accessKeyId) {
    throw new Error('AWS_ACCESS_KEY is undefined');
}

if (!secretAccessKey) {
    throw new Error('AWS_SECRET_KEY is undefined');
}

// Main function for running the migration
async function run(organization: string, repository: string) {
    console.log('Starting migration...');

    // Start the migration on GitHub
    const migration = await octokit.request('POST /orgs/{org}/migrations', {
        org: organization,
        repositories: [
            repository
        ],
        lock_repositories: false
    })

    console.log(`Migration started successfully! \nThe current migration id is ${migration.data.id} and the state is currently on ${migration.data.state}`);

    // Add sleep function to reduce calls to GitHub API when checking the status of the migration
    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Need a migration status when entering the while loop for the first time
    let state = migration.data.state;

    // Wait for status of migration to be exported
    while (state !== 'exported') {
        const check = await octokit.request('GET /orgs/{org}/migrations/{migration_id}', {
            org: organization,
            migration_id: migration.data.id
            })
        console.log(`State is ${check.data.state}... \n`);
        state = check.data.state;
        await sleep(5000);
    }

    console.log(`State changed to ${state}! \nRequesting download url of archive...\n`);
    const archive = await octokit.request('GET /orgs/{org}/migrations/{migration_id}/archive', {
        org: organization,
        migration_id: migration.data.id
    })

    console.log(archive.url);
    
    // Function for uploading archive to our own S3 Bucket
    async function uploadArchive(filename: string) {
        console.log('Uploading Archive to our own S3 bucket');
        const fileStream = fs.createReadStream(filename);
        const uploadParams: PutObjectRequest = {
            Bucket: bucketName,
            Body: fileStream,
            Key: filename,
        };
        
        // this will upload the archive to S3
        return s3.upload(uploadParams).promise();
    }

    // Function for deleting archive from Github
    async function deleteArchive(organization:string, migrationId:number) {
        console.log('Deleting organization migration archive from GitHub');
        await octokit.request('DELETE /orgs/{org}/migrations/{migration_id}/archive', {
            org: organization,
            migration_id: migrationId
        })
    }

    // Function for downloading archive from Github S3 environment
    function downloadArchive(url: string, filename: string) {
       https.get(url, (res) => {
            const writeStream = fs.createWriteStream(filename);
            console.log(`\nDownloading archive file...`);
            res.pipe(writeStream);
            
            writeStream.on('finish', () => {
                console.log('Download Completed!');
                // Upload archive to our own S3 Bucket
                uploadArchive(filename)
                // Deletes a the migration archive. Migration archives are otherwise automatically deleted after seven days.
                deleteArchive(organization, migration.data.id);
                console.log('Backup completed! Goodbye.');
            });

            writeStream.on('error', () => {
                console.log('Error while downloading file');
            })
        });
    }

    // Create a name for the file which has the current date attached to it
    const filename = 'gh_org_archive_' + githubOrganization + '_' + new Date().toJSON().slice(0,10) + '.tar.gz';

    // Download archive from Github and upload it to our own S3 bucket
    downloadArchive(archive.url, filename);
}

// Start the backup script
run(githubOrganization, githubRepository);

// async function listRepo(organization:string) {
//     const repositories = await octokit.request('GET /orgs/{org}/repos?visibility=all', {
//         org: organization
//     })

//     console.log(repositories.data)

//     let repoNames = []

//     repositories.data.forEach(element => repoNames.push(element['full_name']))

//     console.log(repoNames)
// }

// listRepo(githubOrganization);
