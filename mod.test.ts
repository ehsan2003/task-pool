import { Pool } from "./mod.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.133.0/testing/asserts.ts";
Deno.test("at start it must have 0 pending and 0 working", () => {
  const pool = new Pool(1);
  assertEquals(pool.getPendingCount(), 0);
  assertEquals(pool.getWorkingCount(), 0);
});
Deno.test(
  "after a task ran successfully it must have 0 working and 0 pending",
  async () => {
    const pool = new Pool(1);
    const task = async () => {
      const time = 2;
      await sleep(time);
      return "result";
    };
    const result = await pool.exec(task);
    assertEquals(pool.getPendingCount(), 0);
    assertEquals(pool.getWorkingCount(), 0);
    assertEquals(result, "result");
  },
);
Deno.test(
  "after a task ran unsuccessfully it must have 0 working and 0 pending",
  async () => {
    const pool = new Pool(1);
    const task = async () => {
      await sleep(2);
      throw new Error("error");
    };
    try {
      await pool.exec(task);
    } catch (e) {
      assertEquals(pool.getPendingCount(), 0);
      assertEquals(pool.getWorkingCount(), 0);
      assertEquals(e.message, "error");
    }
  },
);

Deno.test("it should have the correct size", () => {
  const pool = new Pool(5);
  assertEquals(pool.getSize(), 5);
});
Deno.test("it should execute tasks in correct order", async () => {
  const pool = new Pool(1);
  let p1Done = false;
  const p1 = pool.exec(() => {
    p1Done = true;
    return sleep(2);
  });
  let p2Done = false;

  const p2 = pool.exec(() => {
    assert(p1Done, "p1 must be done before p2");
    p2Done = true;
    return sleep(2);
  });
  const p3 = pool.exec(() => {
    assert(p2Done, "p2 must be done before p3");
    return sleep(2);
  });

  await Promise.all([p1, p2, p3]);
});
Deno.test("it should increase working if a task is running", async () => {
  const pool = new Pool(1);
  const task = async () => {
    await sleep(2);
    return "result";
  };
  const p = pool.exec(task);
  assertEquals(pool.getPendingCount(), 0);
  assertEquals(pool.getWorkingCount(), 1);
  await p;
  assertEquals(pool.getPendingCount(), 0);
  assertEquals(pool.getWorkingCount(), 0);
});

Deno.test("concurrent tasks should not exceed the maximum", async () => {
  const POOL_SIZE = 5;
  const JOBS = 20;
  const pool = new Pool(POOL_SIZE);
  let executing = 0;
  const promises = [];

  for (let i = 0; i < JOBS; i++) {
    const promise = pool.exec(async () => {
      executing++;
      assert(
        executing <= POOL_SIZE,
        `executing should be less than ${POOL_SIZE} but got ${executing}`,
      );
      await sleep(0);
      executing--;
    });
    promises.push(promise);
  }
  await Promise.all(promises);
});

async function sleep(time: number) {
  await new Promise((resolve) => setTimeout(resolve, time));
}
