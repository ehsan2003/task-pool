type Task<T> = () => Promise<T>;
import Queue from "https://esm.sh/yocto-queue@1.0.0";

type DetachedPromise<T> = {
    promiseResolve: (value: T | PromiseLike<T>) => void;
    promiseReject: (value: T | PromiseLike<T>) => void;
    promise: Promise<T>;
};

export class Pool {
    private workingCount = 0;
    private waitQueue: Queue<DetachedPromise<void>> = new Queue();
    constructor(private size: number) {
        if (size < 1) {
            throw new Error("Pool size must be greater than 0");
        }
    }

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
        { promiseResolve, promiseReject }: DetachedPromise<T>
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

    public getSize(): number {
        return this.size;
    }
    public getWorkingCount(): number {
        return this.workingCount;
    }
    public getPendingCount(): number {
        return this.waitQueue.size;
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
