// Check if all the variables necessary are defined when not using Github Actions
export function checkEnv(): void {
    const requiredVariables = [
        'GH_ORG',
        'GH_API_KEY',
        'AWS_BUCKET_NAME',
        'AWS_BUCKET_REGION',
        'AWS_ACCESS_KEY',
        'AWS_SECRET_KEY'
    ]

    for (const variable of requiredVariables) {
        if (!process.env[variable]) {
            throw new Error(`${variable} is undefined`)
        }
    }
}
