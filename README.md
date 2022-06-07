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