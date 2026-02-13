// Jest setup file
require('dotenv').config({ path: '.env.test' });

// Increase test timeout for database operations
jest.setTimeout(10000);

// Mock console.log in tests to keep output clean
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};
