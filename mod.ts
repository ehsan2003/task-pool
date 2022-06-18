type Task<T> = () => Promise<T>;

type DetachedPromise<T> = {
  promiseResolve: (value: T | PromiseLike<T>) => void;
  promiseReject: (value: T | PromiseLike<T>) => void;
  promise: Promise<T>;
};
/**
 * a pool of tasks ensuring maximum concurrent tasks running is less than the size
 * @param size maximum concurrent tasks
 *
 * @example
 * const pool = new Pool(5);
 * const urls = [
 *     "https://www.google.com/1",
 *     "https://www.google.com/2",
 *     "https://www.google.com/3",
 *     "https://www.google.com/4",
 *     "https://www.google.com/5",
 *     "https://www.google.com/6",
 *     "https://www.google.com/7",
 * ];
 * // here maximum concurrent url being fetched is 5
 * await Promise.all(urls.map((u) => pool.exec(() => fetch(u))));
 */
export class Pool {
  private workingCount = 0;
  private waitQueue: Queue<DetachedPromise<void>> = new Queue();
  constructor(private size: number) {
    if (size < 1) {
      throw new Error("Pool size must be greater than 0");
    }
  }
  /**
   * execute a task in pool
   * @param task task to run
   * @returns promise that resolves when the task is done or rejects if task rejects
   */
  public async exec<T>(task: Task<T>): Promise<T> {
    const detachedPromise = this.createPromise<T>();
    if (this.workingCount < this.size) {
      this.run(task, detachedPromise);
    } else {
      const p = this.createPromise<void>();
      this.waitQueue.enqueue(p);
      await p.promise;
      this.run<T>(task, detachedPromise);
    }

    return detachedPromise.promise;
  }

  private run<T>(
    task: Task<T>,
    { promiseResolve, promiseReject }: DetachedPromise<T>,
  ) {
    this.increaseExecuting();
    task()
      .then((result) => {
        this.decreaseExecuting();
        promiseResolve(result);
      })
      .catch((e) => {
        this.decreaseExecuting();
        promiseReject(e);
      });
  }
  /**
   * returns the size passed on constructor ( maximum concurrent tasks )
   * @returns
   */
  public getSize(): number {
    return this.size;
  }
  /**
   * returns the number of working tasks
   * @returns number of working tasks
   */
  public getWorkingCount(): number {
    return this.workingCount;
  }
  /**
   * returns the number of pending tasks
   * @returns number of pending tasks
   */
  public getPendingCount(): number {
    return this.waitQueue.getSize();
  }
  private increaseExecuting() {
    this.workingCount++;
  }
  private decreaseExecuting() {
    this.workingCount--;
    if (this.workingCount < this.size) {
      this.resolveFirst();
    }
  }
  private resolveFirst() {
    this.waitQueue.dequeue()?.promiseResolve();
  }
  private createPromise<T>(): DetachedPromise<T> {
    let promiseResolve;
    let promiseReject;
    const promise = new Promise<T>((resolve, reject) => {
      promiseResolve = resolve;
      promiseReject = reject;
    });
    // deno-lint-ignore no-explicit-any
    return { promiseResolve, promiseReject, promise } as any;
  }
}

type Node<T> = {
  value: T;
  next: Node<T> | null;
};
export default class Queue<T> {
  private head: Node<T> | null = null;
  private tail: Node<T> | null = null;
  private size = 0;

  constructor() {
    this.clear();
  }

  enqueue(value: T) {
    const node = { value, next: null };

    if (this.head) {
      this.tail!.next = node;
      this.tail = node;
    } else {
      this.head = node;
      this.tail = node;
    }

    this.size++;
  }

  dequeue() {
    const current = this.head;
    if (!current) {
      return;
    }

    this.head = this.head!.next;
    this.size--;
    return current.value;
  }

  clear() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  getSize() {
    return this.size;
  }

  *[Symbol.iterator]() {
    let current = this.head;

    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}
