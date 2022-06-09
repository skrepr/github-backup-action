<a href="https://skrepr.com/">
  <p align="center">
    <img width="200" height="100" src="https://skrepr.com/wp-content/uploads/2021/10/skrepr_logo_liggend.svg" alt="skrepr" />
  </p>
</a>
<h1 align="center">Github Backup Actiony</h1>
<div align="center">
  <a href="https://github.com/skrepr/github-backup-action/releases"><img src="https://img.shields.io/github/release/skrepr/github-backup-action.svg" alt="Releases"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/blob/main/LICENSE"><img src="https://img.shields.io/github/license/skrepr/github-backup-action" alt="LICENSE"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/actions/workflows/ci.yml"><img src="https://github.com/skrepr/github-backup-action/actions/workflows/ci.yml/badge.svg" alt="CI"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/issues"><img src="https://img.shields.io/github/issues/skrepr/github-backup-action.svg" alt="Issues"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/pulls"><img src="https://img.shields.io/github/issues-pr/skrepr/github-backup-action.svg" alt="PR"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/commits"><img src="https://img.shields.io/github/commit-activity/m/skrepr/github-backup-action" alt="Commits"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/stars"><img src="https://img.shields.io/github/stars/skrepr/github-backup-action.svg" alt="Stars"/></a><a> </a>
  <a href="https://github.com/skrepr/github-backup-action/releases"><img src="https://img.shields.io/github/forks/skrepr/github-backup-action.svg" alt="Forks"/></a><a> </a>
</div>

# About

This GitHub Action allows to backup and archive a organization repository to an S3 Bucket with the help of the [GitHub Organization migrations API](https://docs.github.com/en/rest/migrations/orgs#start-an-organization-migration)

# Requirements

The Migrations API is only available to authenticated organization owners. For more information, see "Roles in an organization" and "Other authentication methods."

# Github Action example config

```yaml
    - name: Github Org Backup
      uses: skrepr/github-backup-action@v1
      env:
        GH_ORG: ${GITHUB_ACTOR}
        GH_APIKEY: ${GITHUB_TOKEN}
        GH_REPO: ${GITHUB_REPOSITORY}
        AWS_BUCKET_NAME: "your-bucket-here"
        AWS_BUCKET_REGION: "eu-west-1"
        AWS_ARN: "arn:aws:s3:::your-bucket-here"
        AWS_ACCESS_KEY: ${AWS_ACCESS_KEY} # Github Secret is advised
        AWS_SECRET_KEY: ${AWS_SECRET_KEY} # Github Secret is advised
```

# AWS policy for S3 bucket

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
                "arn:aws:s3:::skrepr-backup-github"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::skrepr-backup-github/*"
            ]
        }
    ]
}
```

# Recovering your repositories from the archive

Github migrations only archives your .git from every repository.

To recover your code from the archive:

1. Place all the repo.git file in a .git folder.
2. Execute the command `git init`
3. After Git has reinitialized the project, execute `git reset --hard HEAD`


## License

MIT / BSD

## Author Information

This role was created in 2021 by [Jeroen van der Meulen](https://github.com/jeroenvandermeulen), commisioned by [Skrepr](https://skrepr.com)
