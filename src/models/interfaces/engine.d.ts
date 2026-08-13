export interface IEngine {
  start(): void;
  stop(): void;
  flush(time: number): void;
  update(time: number): void;
}
