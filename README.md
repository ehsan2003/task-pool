a simple task queue for javascript which ensures maximum concurrent tasks are
less than the pool size it is mostly useful for requesting thousands of
resources concurrently but avoid and keep maximum connections behind a boundary
example :

### example

```typescript
const pool = new Pool(5);
const urls = [
    "https://www.google.com/1",
    "https://www.google.com/2",
    "https://www.google.com/3",
    "https://www.google.com/4",
    "https://www.google.com/5",
    "https://www.google.com/6",
    "https://www.google.com/7",
];
// here maximum concurrent url being fetched is 5
await Promise.all(urls.map((u) => pool.exec(() => fetch(u))));
```

### Api Docs

https://doc.deno.land/https://raw.githubusercontent.com/ehsan2003/task-pool/main/mod.ts

the code is simple so if you confused about anything read the code its most of the time best way to understand things or just open an issue
