type Node<T> = {
  value: T;
  next: Node<T> | null;
};
export class FIFOQueue<T> {
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
