export class LRU {
  constructor(capacity) {
    this.capacity = capacity;
    this.dict = new Map();
  }

  get(key) {
    let tmp = this.dict.get(key);
    if (tmp == undefined) return undefined;
    this.dict.delete(key);
    this.dict.set(key, tmp);
    return tmp;
  }

  put(key, val) {
    let tmp = this.dict.get(key);
    if (tmp == undefined) {
      this.dict.set(key, val);
      if (this.dict.size > this.capacity) {
        let dKey = this.dict.keys().next().value;
        this.dict.delete(dKey);
      }
    } else {
      this.dict.delete(key);
      this.dict.set(key, val);
    }
  }
}
