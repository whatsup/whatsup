module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    moduleNameMapper: {
        '@whatsup/jsx': '<rootDir>/src/',
    },
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.ts', 'src/**/*.tsx'],
}
