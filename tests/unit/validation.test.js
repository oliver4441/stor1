import { describe, it, expect } from 'vitest';
import { loginSchema, listingSchema } from '../../src/lib/validation';

describe('Validation Schemas', () => {
  it('validates login input correctly', () => {
    const valid = loginSchema.safeParse({ email: 'user@example.com', password: 'password123' });
    expect(valid.success).toBe(true);

    const invalid = loginSchema.safeParse({ email: 'invalid-email', password: '123' });
    expect(invalid.success).toBe(false);
  });

  it('validates listing input correctly', () => {
    const validListing = listingSchema.safeParse({ title: 'Product 1', price: 100, quantity: 5 });
    expect(validListing.success).toBe(true);

    const invalidListing = listingSchema.safeParse({ title: 'A', price: -5, quantity: -1 });
    expect(invalidListing.success).toBe(false);
  });
});
