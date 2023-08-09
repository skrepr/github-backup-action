/* eslint-disable no-inner-declarations */
import {Octokit} from '@octokit/core'
import * as core from '@actions/core'
import { Upload } from "@aws-sdk/lib-storage";
import * as AWS_S3 from "@aws-sdk/client-s3";
import * as fs from 'fs'
import axios from 'axios';
import 'dotenv/config'

// All the GitHub variables
const githubOrganization: string = process.env.GH_ORG as string
const octokit = new Octokit({
    auth: process.env.GH_APIKEY
})

// All the AWS variables
const { S3 } = AWS_S3;
const bucketName: string = process.env.AWS_BUCKET_NAME as string
const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
});

// All the script variables
const downloadMigration: boolean = process.env.DOWNLOAD_MIGRATION === 'true'

// Check if all the variables necessary are defined
export function check(): void {
  const requiredVariables = [
      'GH_ORG', 'GH_APIKEY',
      'AWS_BUCKET_NAME', 'AWS_BUCKET_REGION',
      'AWS_ACCESS_KEY', 'AWS_SECRET_KEY',
      'DOWNLOAD_MIGRATION'
  ];

  for (const variable of requiredVariables) {
      if (!process.env[variable]) {
          throw new Error(`${variable} is undefined`);
      }
  }
}

// Add sleep function to reduce calls to GitHub API when checking the status of the migration
async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function getRepoNames(organization: string): Promise<string[]> {
  try {
    console.log('\nGet list of repositories...\n')

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
  } catch (error) {
    console.error('Error occurred while retrieving list of repositories:', error)
    throw error;
  }
}

// Function for running the migration
async function runMigration(organization: string): Promise<void> {
  try {
      // Fetch repo names asynchronously
      const repoNames = await getRepoNames(organization)

      console.log(repoNames)

      console.log('\nStarting migration...\n')

  // Start the migration on GitHub
  const migration = await octokit.request('POST /orgs/{org}/migrations', {
    org: organization,
    repositories: repoNames,
    lock_repositories: false
  });

  // Write the response to a file
  fs.writeFileSync('migration_response.json', JSON.stringify(migration.data));

      console.log(
          `Migration started successfully!\n The current migration id is ${migration.data.id} and the state is currently on ${migration.data.state}\n`
      )

  } catch (error) {
      console.error('Error occurred during the migration:', error)
  }
}

// Function for downloading the migration
async function runDownload(organization: string): Promise<void> {

  // Function for retrieving data from the stored file that the runMigration function created
  async function retrieveMigrationData() {
    try {
      // Read the contents of the file
      const fileContents = fs.readFileSync('migration_response.json', 'utf-8');
  
      // Parse the JSON contents back into a JavaScript object
      const migrationData = JSON.parse(fileContents);
  
      // Now you can access the data from the migration response
      console.log('Successfully loaded migration data!\n');
  
      return migrationData; // Return the parsed data to be used later
    } catch (error) {
      console.error('Error occurred while reading the file:', error);
      return null;
    }
  }

  try {
      // Retrieve the migration data from the file
      const migration = await retrieveMigrationData();

      // Need a migration status when entering the while loop for the first time
      let state = migration.state

      // Wait for status of migration to be exported
      while (state !== 'exported') {
          const check = await octokit.request(
              'GET /orgs/{org}/migrations/{migration_id}',
              {
                  org: organization,
                  migration_id: migration.id
              }
          )
          console.log(`State is ${check.data.state}... \n`)
          state = check.data.state
          await sleep(5000)
      }

      console.log(
        `State changed to ${state}!\n`
      )

      // Function for uploading archive to our own S3 Bucket
      async function uploadArchive(filename: string): Promise<unknown> {
        try {
          console.log('Uploading archive to our own S3 bucket...\n')
          const fileStream = fs.createReadStream(filename)
          const uploadParams: AWS_S3.PutObjectCommandInput = {
              Bucket: bucketName,
              Body: fileStream,
              Key: filename
          }

          // this will upload the archive to S3
          return new Upload({
              client: s3,
              params: uploadParams
          }).done();
        } catch (error) {
          console.error('Error occurred while uploading the file:', error);
        }
      }

      // Function for deleting archive from Github
      async function deleteArchive(organization: string, migrationId: number): Promise<void> {
        try {
          console.log('Deleting organization migration archive from GitHub...\n')
            await octokit.request(
                'DELETE /orgs/{org}/migrations/{migration_id}/archive',
                {
                    org: organization,
                    migration_id: migrationId
                }
            )
        } catch (error) {
          console.error('Error occurred while deleting the archive:', error);
        }
      }

      // Function for downloading archive from GitHub S3 environment
      async function downloadArchive(organization, migration, url) {
        const maxRetries = 3;
        const timeoutDuration = 30000; // 30 seconds
        for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
          try {

            console.log(
              `Requesting download of archive with migration_id: ${migration}...\n`
            )

            const archiveUrl = url + '/archive'

            const archiveResponse = await axios.get(archiveUrl, {
              responseType: 'stream',
              headers: {
                Authorization: `token ${process.env.GH_APIKEY}`,
              },
            });

            console.log(
              `Creating filename...\n`
            )
            // Create a name for the file which has the current date attached to it
            const filename = `gh_org_archive_${organization}_${new Date()
              .toJSON()
              .slice(0, 10)}.tar.gz`

              console.log(
                `Starting download...\n`
              )

            const writeStream = fs.createWriteStream(filename);
            console.log('Downloading archive file...\n');

            archiveResponse.data.pipe(writeStream);

            return new Promise<void>((resolve, reject) => {
              writeStream.on('finish', () => {
                console.log('Download completed!\n');
                // Upload archive to our own S3 Bucket
                uploadArchive(filename);
                // Deletes the migration archive. Migration archives are otherwise automatically deleted after seven days.
                deleteArchive(organization, migration);
                console.log('Backup completed! Goodbye.\n');
                resolve();
              });

              writeStream.on('error', (err) => {
                console.log('Error while downloading file:', err.message);
                reject(err);
              });
            });
          } catch (error) {
            // Handle the API call error here
            console.error(`Error occurred during attempt ${retryCount}:`, error);
      
            // If it's the last retry, throw the error to be caught outside the loop
            if (retryCount === maxRetries) {
              throw error;
            }
      
            // If it's not the last retry, wait for the timeout before retrying
            console.log('Retrying in 30 seconds...\n');
            await sleep(timeoutDuration);
          }
        }
      }

      // Download archive from Github and upload it to our own S3 bucket
      downloadArchive(organization, migration.id, migration.url)

  } catch (error) {
      console.error('Error occurred during download:', error)
  }
}

// Check if all variables are defined
check()

if (!downloadMigration) {
  // Start the backup script when downloadMigration is false
  runMigration(githubOrganization);
} else {
  // Start the download script when downloadMigration is true
  runDownload(githubOrganization);
}
