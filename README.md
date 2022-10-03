<a href="https://skrepr.com/">
  <p align="center">
    <img width="200" height="100" src="https://cdn.skrepr.com/logo/skrepr_liggend.svg" alt="skrepr_logo" alt="skrepr" />
  </p>
</a>
<h1 align="center">Github Backup Action</h1>
<div align="center">
  <a href="https://github.com/skrepr/github-backup-action/releases"><img src="https://img.shields.io/github/release/skrepr/github-backup-action.svg" alt="Releases"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/blob/main/LICENSE"><img src="https://img.shields.io/github/license/skrepr/github-backup-action.svg" alt="LICENSE"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/issues"><img src="https://img.shields.io/github/issues/skrepr/github-backup-action.svg" alt="Issues"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/pulls"><img src="https://img.shields.io/github/issues-pr/skrepr/github-backup-action.svg" alt="PR"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/commits"><img src="https://img.shields.io/github/commit-activity/m/skrepr/github-backup-action" alt="Commits"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/stars"><img src="https://img.shields.io/github/stars/skrepr/github-backup-action.svg" alt="Stars"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/releases"><img src="https://img.shields.io/github/forks/skrepr/github-backup-action.svg" alt="Forks"/></a><a> </a>
</div>

# About

This GitHub Action allows you to backup and archive a organization repository to an S3 Bucket with the help of the [GitHub Organization migrations API](https://docs.github.com/en/rest/migrations/orgs#start-an-organization-migration)

# Requirements

The Migrations API is only available to authenticated organization owners. For more information, see "Roles in an organization" and "Other authentication methods."

Ensure that you have owner permissions on the source organization's repositories.
[Generate an access token](https://docs.github.com/en/enterprise-server@3.6/articles/creating-an-access-token-for-command-line-use) with the `repo` and `admin:org` scopes on GitHub.com.
To minimize downtime, make a list of repositories you want to export from the source instance. You can add multiple repositories to an export at once using a text file that lists the URL of each repository on a separate line.

# Commands

To build the project: `npm build`
To watch project during developement: `npm watch`
To run the script: `npm dist/main.ts`
List all repos: `curl "https://api.github.com/orgs/skrepr/repos" \
     -u 'username:<personal access token>'`
# Github Action example config

```yaml
name: Backup repository

on:
  schedule:
    - cron: '0 1 * * 0'  # At 01:00 on Sunday
  workflow_dispatch:

jobs:
  backup:
    name: Backup repository
    runs-on: ubuntu-latest

    steps:
    - name: Github Migrations Backup
      uses: skrepr/github-backup-action@1.0.0
      env:
        GH_ORG: 'your-org-here'
        GH_REPO: 'your-repo-here'
        GH_APIKEY: ${{ secrets.GH_PAT }} # You can't use GITHUB_TOKEN to use the API
        AWS_BUCKET_NAME: 'your-bucket-here'
        AWS_BUCKET_REGION: 'eu-west-1'
        AWS_ARN: 'arn:aws:s3:::your-bucket-here'
        AWS_ACCESS_KEY: ${{ secrets.AWS_ACCESS_KEY }} # Github Secret is advised
        AWS_SECRET_KEY: ${{ secrets.AWS_SECRET_KEY }} # Github Secret is advised
```

# AWS policy for S3 bucket user

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-here"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-here/*"
            ]
        }
    ]
}
```

# Recovering your repositories from the archive

Github migrations only archives your .git from every repository.

To recover your code from the archive:

1. Place all the repo.git files in a .git folder.
2. Execute the command `git init`
3. After Git has reinitialized the project, execute `git reset --hard HEAD`


## License

MIT / BSD

## Author Information

This Github Action was created in 2022 by [Jeroen van der Meulen](https://github.com/jeroenvandermeulen), commisioned by [Skrepr](https://skrepr.com)
