module.exports = {
    testEnvironment: 'node',
    testPathIgnorePatterns: ['__config__', '__fixtures__'],
    transform: {
        '^.+\\.tsx?$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx'],
}
