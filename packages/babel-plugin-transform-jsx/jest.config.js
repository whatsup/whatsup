module.exports = {
    testEnvironment: 'node',
    testPathIgnorePatterns: ['__config__'],
    transform: {
        '^.+\\.tsx?$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx'],
}
