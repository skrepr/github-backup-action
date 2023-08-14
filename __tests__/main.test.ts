import {getRepoNames} from '../src/main'

describe('getRepoNames', () => {
    it('should fetch repository names for the given organization', async () => {
        const organization = 'testOrg'

        const repoNames = await getRepoNames(organization)

        expect(repoNames).toEqual(['testorg/publicrepo', 'testorg/publicrepo2'])
    })

    it('should handle errors when fetching repository names', async () => {
        const organization = 'testOrgthatdoesnotexist'

        await expect(getRepoNames(organization)).rejects.toThrowError(
            'Not Found'
        )
    })
})
