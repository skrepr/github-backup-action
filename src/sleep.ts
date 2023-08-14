// Add sleep function to reduce calls to GitHub API when checking the status of the migration
export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
