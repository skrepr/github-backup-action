import { Octokit } from '@octokit/core';
import S3, { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import * as https from 'https';

require('dotenv').config();

const githubOrganisation = process.env.GH_ORG;
const octokit = new Octokit({
    auth: process.env.GH_APIKEY
})

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const s3 = new S3({  region,  accessKeyId,  secretAccessKey});

if (!githubOrganisation) {
    throw new Error('GH_ORG is undefined');
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

async function run(organization: string) {
    console.log('Starting migration...');
    const migration = await octokit.request('POST /orgs/{org}/migrations', {
        org: `${organization}`,
        repositories: [
            'skrepr/github-backup-action'
        ],
        lock_repositories: false
    })

    console.log(`Migration started successfully! \n The current migration id is ${migration.data.id} and the state is currently on ${migration.data.state}`);

    let state = migration.data.state;

    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    while (state !== 'exported') {
        const check = await octokit.request('GET /orgs/{org}/migrations/{migration_id}', {
            org: `${organization}`,
            migration_id: migration.data.id
            })
        console.log(`State is ${check.data.state}... \n`);
        state = check.data.state;
        await sleep(5000);
    }

    console.log(`State changed to ${state}! \n Requesting download url of archive...`);
    const archive = await octokit.request('GET /orgs/{org}/migrations/{migration_id}/archive', {
        org: `${organization}`,
        migration_id: migration.data.id
    })

    console.log('Archive url:');
    console.log(archive.url);
    
    function downloadFile(url: string, filename: string) {
       https.get(url, (res) => {
            const writeStream = fs.createWriteStream(filename);
            console.log(`State changed to ${state}! \n Downloading archive file...`);
            res.pipe(writeStream);
            
            writeStream.on('finish', () => {
                console.log('Download Completed');
                uploadFile(filename)
            });

            writeStream.on('error', () => {
                console.log('Error while downloading file');
            })
        });
    }

    // Upload file to S3
    async function uploadFile(filename: string) {
        const fileStream = fs.createReadStream(filename);
        const uploadParams: PutObjectRequest = {
            Bucket: bucketName,
            Body: fileStream,
            Key: filename,
        };
        
        return s3.upload(uploadParams).promise(); // this will upload file to S3}
    }

    const filename = 'gh_org_archive_' + githubOrganisation + '_' + new Date().toJSON().slice(0,10) + '.tar.gz';

    downloadFile(archive.url, filename);
}

run(githubOrganisation);