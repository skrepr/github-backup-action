# github-backup-action

Based off https://gist.github.com/rodw/3073987

```yaml
    - name: Github Org Backup
      uses: skrepr/github-backup-action@v1
      env:
        GHBU_ORG:
        GHBU_UNAME:
        GHBU_PASSWD:

      with:
        args: --overwrite --remove
```

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