/** A reset invalidates every continuation created in the previous scope. */
export class ActionScope {
    private generation = 0;
    get token() { return this.generation; }
    cancel() { this.generation++; }
    isCurrent(token: number) { return token === this.generation; }
}
