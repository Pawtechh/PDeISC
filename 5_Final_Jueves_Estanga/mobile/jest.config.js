const path = require('path');

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      path.resolve(__dirname, '../backend/node_modules/ts-jest'),
      {
        isolatedModules: true,
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          target: 'ES2022',
          module: 'commonjs',
          moduleResolution: 'node',
          strict: true,
          skipLibCheck: true,
          types: ['jest', 'node'],
          typeRoots: [
            path.resolve(__dirname, '../backend/node_modules/@types'),
            path.resolve(__dirname, 'node_modules/@types'),
          ],
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/src/__mocks__/react-native.js',
    '^expo-secure-store$': '<rootDir>/src/__mocks__/expo-secure-store.js',
  },
};
