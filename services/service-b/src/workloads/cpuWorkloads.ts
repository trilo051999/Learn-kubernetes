import bcrypt from 'bcryptjs';

// Workload 1: Calculate primes up to 100,000
export function calculatePrimes(): number {
  const limit = 100000;
  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(i);
  }
  return primes.length;
}

// Workload 2: Bcrypt hashing (10 rounds)
export function hashPassword(): string {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync("super-secret-password-to-hash", salt);
  return hash;
}

// Workload 3: Generate + sort array of 100,000 integers
export function generateAndSortArray(): number {
  const size = 100000;
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 1000000));
  arr.sort((a, b) => a - b);
  return arr.length;
}
