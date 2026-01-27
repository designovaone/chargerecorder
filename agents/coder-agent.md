# Coder Agent Guidelines

> An experienced developer agent ensuring performant, secure, well-documented code that follows best practices.

## Core Philosophy

### 🚀 Performance-First Mindset
- **Optimize for speed**: Every millisecond matters to users
- **Measure before optimizing**: Use profiling, not assumptions
- **Lazy load everything**: Only load what's needed, when it's needed
- **Cache strategically**: Memoize expensive computations

### 🔒 Security by Default
- **Never trust user input**: Validate and sanitize everything
- **Principle of least privilege**: Grant minimum permissions required
- **Defense in depth**: Multiple layers of security
- **Fail securely**: Errors should not expose sensitive information

### 📖 Readability Over Cleverness
- **Code is read more than written**: Optimize for the reader
- **Self-documenting code**: Names should explain intent
- **Comments explain "why"**: Code explains "what"
- **Consistent formatting**: Follow established patterns

### 💎 Never Compromise on Quality
- **No shortcuts**: Technical debt compounds exponentially
- **Test everything**: Untested code is broken code
- **Handle all errors**: Edge cases are not optional
- **Review your own code**: Before committing, review as a stranger would

---

## Code Standards

### TypeScript Strict Mode

Always enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Type Definitions

```typescript
// ✅ DO: Use explicit types for function parameters and returns
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ❌ DON'T: Use `any` type
function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price * item.quantity, 0);
}

// ✅ DO: Use union types for known values
type Status = 'pending' | 'active' | 'completed' | 'cancelled';

// ❌ DON'T: Use string when values are known
type Status = string;
```

### Function Documentation (JSDoc)

Every exported function must have JSDoc documentation:

```typescript
/**
 * Calculates the total price of items in a shopping cart.
 * Applies quantity multipliers and rounds to 2 decimal places.
 * 
 * @param items - Array of cart items with price and quantity
 * @returns Total price rounded to 2 decimal places
 * @throws {Error} If items array is empty
 * 
 * @example
 * const total = calculateTotal([
 *   { id: '1', price: 10.99, quantity: 2 },
 *   { id: '2', price: 5.50, quantity: 1 }
 * ]);
 * // Returns: 27.48
 */
export function calculateTotal(items: CartItem[]): number {
  if (items.length === 0) {
    throw new Error('Cannot calculate total of empty cart');
  }
  
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity, 
    0
  );
  
  return Math.round(total * 100) / 100;
}
```

### Error Handling

```typescript
// ✅ DO: Use custom error classes for domain errors
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ DO: Handle errors explicitly with proper types
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      throw new ApiError(`Failed to fetch user: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error while fetching user', { cause: error });
  }
}

// ❌ DON'T: Swallow errors silently
async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);
    return await response.json();
  } catch (error) {
    console.log(error); // Silent failure!
    return null;
  }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `itemCount` |
| Functions | camelCase, verb prefix | `getUserById`, `validateEmail` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Types/Interfaces | PascalCase | `UserProfile`, `CartItem` |
| Components | PascalCase | `UserCard`, `NavigationMenu` |
| Files (components) | PascalCase | `UserCard.tsx`, `NavigationMenu.tsx` |
| Files (utilities) | camelCase | `formatDate.ts`, `apiClient.ts` |
| Boolean variables | is/has/can prefix | `isLoading`, `hasError`, `canEdit` |

---

## Performance Rules

### React Memoization

```typescript
// ✅ DO: Memoize expensive computations
const sortedItems = useMemo(() => {
  return items.slice().sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// ✅ DO: Memoize callbacks passed to children
const handleClick = useCallback((id: string) => {
  setSelectedId(id);
}, []);

// ✅ DO: Memoize components that receive stable props
const MemoizedList = React.memo(function ItemList({ items }: Props) {
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
});

// ❌ DON'T: Create functions inline in JSX
<Button onClick={() => handleSelect(item.id)} /> // Creates new function every render

// ✅ DO: Use stable references
<Button onClick={handleClick} data-id={item.id} />
```

### Avoiding Re-renders

```typescript
// ✅ DO: Lift state up only when necessary
// ✅ DO: Use context sparingly and split contexts by update frequency

// ❌ DON'T: Put rapidly changing state in context
const BadContext = createContext({ 
  user: null,
  mousePosition: { x: 0, y: 0 } // Updates constantly, re-renders everything!
});

// ✅ DO: Split into separate contexts
const UserContext = createContext({ user: null });
const MouseContext = createContext({ x: 0, y: 0 });
```

### Code Splitting & Lazy Loading

```typescript
// ✅ DO: Lazy load routes and heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));

// ✅ DO: Use Suspense with meaningful fallbacks
<Suspense fallback={<DashboardSkeleton />}>
  <Dashboard />
</Suspense>

// ✅ DO: Preload on hover for faster perceived navigation
const preloadDashboard = () => import('./pages/Dashboard');

<Link 
  to="/dashboard" 
  onMouseEnter={preloadDashboard}
>
  Dashboard
</Link>
```

### Database & API Optimization

```typescript
// ✅ DO: Select only needed fields
const users = await db.user.findMany({
  select: { id: true, name: true, email: true }
});

// ❌ DON'T: Fetch entire records when not needed
const users = await db.user.findMany(); // Fetches all columns

// ✅ DO: Use pagination
const users = await db.user.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' }
});

// ✅ DO: Batch related queries
const [users, posts] = await Promise.all([
  db.user.findMany(),
  db.post.findMany()
]);

// ❌ DON'T: N+1 queries
const users = await db.user.findMany();
for (const user of users) {
  user.posts = await db.post.findMany({ where: { userId: user.id } }); // N queries!
}
```

---

## Security Guidelines

### Input Validation

```typescript
import { z } from 'zod';

// ✅ DO: Validate all user input with schemas
const UserInputSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).trim(),
  age: z.number().int().min(0).max(150).optional(),
});

export async function createUser(input: unknown) {
  const validated = UserInputSchema.parse(input); // Throws on invalid input
  return await db.user.create({ data: validated });
}

// ❌ DON'T: Trust user input directly
export async function createUser(input: any) {
  return await db.user.create({ data: input }); // SQL injection risk!
}
```

### XSS Prevention

```typescript
// ✅ DO: React escapes by default - use it
<div>{userContent}</div>

// ⚠️ DANGER: Never use dangerouslySetInnerHTML with user content
<div dangerouslySetInnerHTML={{ __html: userContent }} /> // XSS vulnerability!

// ✅ DO: If HTML is required, sanitize first
import DOMPurify from 'dompurify';
const sanitized = DOMPurify.sanitize(userContent);
<div dangerouslySetInnerHTML={{ __html: sanitized }} />

// ✅ DO: Use Content Security Policy headers
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self'"
  }
];
```

### Environment Variables

```typescript
// ✅ DO: Validate environment variables at startup
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);

// ✅ DO: Never expose server secrets to client
// Only NEXT_PUBLIC_ variables are sent to browser

// ❌ DON'T: Hardcode secrets
const apiKey = 'sk-1234567890abcdef'; // Never do this!

// ❌ DON'T: Log sensitive data
console.log('User logged in:', { email, password }); // Exposes password in logs!
```

### Authentication Patterns

```typescript
// ✅ DO: Use secure session management
import { getServerSession } from 'next-auth';

export async function getUser() {
  const session = await getServerSession();
  
  if (!session?.user) {
    throw new AuthenticationError('Not authenticated');
  }
  
  return session.user;
}

// ✅ DO: Check authorization on every request
export async function updatePost(postId: string, data: PostUpdate) {
  const user = await getUser();
  const post = await db.post.findUnique({ where: { id: postId } });
  
  if (!post) {
    throw new NotFoundError('Post not found');
  }
  
  if (post.authorId !== user.id && user.role !== 'admin') {
    throw new ForbiddenError('Not authorized to update this post');
  }
  
  return await db.post.update({ where: { id: postId }, data });
}
```

---

## Best Practices

### SOLID Principles

```typescript
// Single Responsibility: Each class/function does one thing
class UserRepository {
  async findById(id: string): Promise<User | null> { /* ... */ }
  async save(user: User): Promise<void> { /* ... */ }
}

class UserEmailService {
  async sendWelcome(user: User): Promise<void> { /* ... */ }
  async sendPasswordReset(user: User): Promise<void> { /* ... */ }
}

// Open/Closed: Open for extension, closed for modification
interface PaymentProcessor {
  process(amount: number): Promise<PaymentResult>;
}

class StripeProcessor implements PaymentProcessor { /* ... */ }
class PayPalProcessor implements PaymentProcessor { /* ... */ }

// Dependency Inversion: Depend on abstractions
class OrderService {
  constructor(private readonly paymentProcessor: PaymentProcessor) {}
  
  async checkout(order: Order): Promise<void> {
    await this.paymentProcessor.process(order.total);
  }
}
```

### DRY (Don't Repeat Yourself)

```typescript
// ❌ DON'T: Duplicate logic
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUserEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // Duplicated!
}

// ✅ DO: Create reusable utilities
// utils/validation.ts
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string) => emailRegex.test(email);

// ✅ DO: Extract shared components
// components/ui/FormField.tsx
export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Testing Strategies

```typescript
// ✅ DO: Write unit tests for pure functions
describe('calculateTotal', () => {
  it('returns sum of item prices multiplied by quantities', () => {
    const items = [
      { id: '1', price: 10, quantity: 2 },
      { id: '2', price: 5, quantity: 1 },
    ];
    
    expect(calculateTotal(items)).toBe(25);
  });
  
  it('throws error for empty cart', () => {
    expect(() => calculateTotal([])).toThrow('Cannot calculate total of empty cart');
  });
});

// ✅ DO: Write integration tests for API routes
describe('POST /api/users', () => {
  it('creates user with valid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test User' });
    
    expect(response.status).toBe(201);
    expect(response.body.email).toBe('test@example.com');
  });
  
  it('returns 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'invalid', name: 'Test User' });
    
    expect(response.status).toBe(400);
  });
});
```

---

## Do's and Don'ts

### ✅ Do
- Use TypeScript strict mode
- Document all exported functions with JSDoc
- Validate all user input at API boundaries
- Memoize expensive computations and callbacks
- Handle all error cases explicitly
- Write tests for critical paths
- Use meaningful variable and function names
- Keep functions small and focused (< 50 lines)
- Review code before committing

### ❌ Don't
- Use `any` type (use `unknown` if type is truly unknown)
- Catch errors without handling them
- Trust user input without validation
- Hardcode secrets or sensitive data
- Create functions inline in JSX render
- Ignore TypeScript errors with `@ts-ignore`
- Use `var` (use `const` or `let`)
- Mutate state directly in React
- Skip error boundaries in production
- Deploy without testing
