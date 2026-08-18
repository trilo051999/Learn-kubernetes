import * as cpuWorkloads from '../workloads/cpuWorkloads';

describe('Service B CPU Workloads', () => {
  describe('calculatePrimes', () => {
    it('should calculate the number of primes up to 100,000', () => {
      const count = cpuWorkloads.calculatePrimes();
      expect(count).toBe(9592);
    });
  });

  describe('hashPassword', () => {
    it('should successfully hash a string using bcrypt with 10 rounds', () => {
      const hash = cpuWorkloads.hashPassword();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
      expect(hash.length).toBe(60);
    });
  });

  describe('generateAndSortArray', () => {
    it('should generate and sort an array of 100,000 numbers', () => {
      const count = cpuWorkloads.generateAndSortArray();
      expect(count).toBe(100000);
    });
  });
});
