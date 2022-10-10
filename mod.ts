import { FIFOQueue } from "./FIFOQueue";

type Task<T> = () => Promise<T>;

class Deffered<T> {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (value: T | PromiseLike<T>) => void;
  promise: Promise<T>;
}

export class Pool {
  private workingCount = 0;
  private waitQueue: FIFOQueue<Deffered<void>> = new FIFOQueue();
  constructor(private size: number) {
    if (size < 1) {
      throw new Error("Pool size must be greater than 0");
    }
  }
  public async exec<T>(task: Task<T>): Promise<T> {
    if (this.workingCount >= this.size) {
      await this.waitForAvailability();
    }

    this.workingCount++;
    try {
      return await task();
    } finally {
      this.workingCount--;
      if (this.workingCount < this.size) {
        this.releaseFirstWaiter();
      }
    }
  }

  private releaseFirstWaiter() {
    this.waitQueue.dequeue()?.resolve();
  }

  private async waitForAvailability() {
    const wait = new Deffered<void>();
    this.waitQueue.enqueue(wait);
    await wait.promise;
  }

  public getSize(): number {
    return this.size;
  }
  public getWorkingCount(): number {
    return this.workingCount;
  }
  public getPendingCount(): number {
    return this.waitQueue.getSize();
  }
}
