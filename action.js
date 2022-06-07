import { Octokit } from "@octokit/core";
import * as fs from 'fs';
import * as https from 'https';

const gh_org = 'skrepr';
const octokit = new Octokit({
    auth: 'your_key_here'
  })

async function run(organization) {
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    while (state != 'exported') {
        const check = await octokit.request('GET /orgs/{org}/migrations/{migration_id}', {
            org: `${organization}`,
            migration_id: `${migration.data.id}`
            })
        console.log(`State is ${check.data.state}... \n`);
        state = check.data.state;
        await sleep(5000);
    }

    console.log(`State changed to ${state}! \n Starting download of archive...`);
    const archive = await octokit.request('GET /orgs/{org}/migrations/{migration_id}/archive', {
        org: `${organization}`,
        migration_id: `${migration.data.id}`
    })


    // File URL
    const url = archive.url
    

    // Download the file
    https.get(url, (res) => {

        // Open file in local filesystem
        const file = fs.createWriteStream(`archive.gz`);

        // Write data into local file
        res.pipe(file);

        // Close the file
        file.on('finish', () => {
            file.close();
            console.log(`File downloaded!`);
        });

    }).on("error", (err) => {
        console.log("Error: ", err.message);
    });
}

(async () => {
    console.log(await run(gh_org))
  })()