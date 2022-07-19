module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx'],
}
