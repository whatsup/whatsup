module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.ts'],
}
