export interface Task {
    id: string;
    name: string;
    duration: number;
    precedents: string[];
}

export interface CpmResult {
    id: string;
    name: string;
    duration: number;
    es: number;
    ef: number;
    ls: number;
    lf: number;
    float: number;
    critical: boolean;
}

export function computeCpm(tasks: Task[]): CpmResult[] {
    if (tasks.length === 0) return [];

    // Build predecessor and successor maps (by name)
    const predecessorMap = new Map<string, string[]>();
    const successorMap = new Map<string, string[]>();

    for (const task of tasks) {
        predecessorMap.set(task.name, [...task.precedents]);
        if (!successorMap.has(task.name)) {
            successorMap.set(task.name, []);
        }
        for (const pred of task.precedents) {
            const succs = successorMap.get(pred) ?? [];
            succs.push(task.name);
            successorMap.set(pred, succs);
        }
    }

    // Kahn's algorithm — topological sort
    const inDegree = new Map<string, number>();
    for (const task of tasks) {
        inDegree.set(task.name, (predecessorMap.get(task.name) ?? []).length);
    }

    const queue: string[] = [];
    for (const task of tasks) {
        if (inDegree.get(task.name) === 0) {
            queue.push(task.name);
        }
    }

    const sortedNames: string[] = [];
    while (queue.length > 0) {
        const name = queue.shift()!;
        sortedNames.push(name);
        for (const succ of (successorMap.get(name) ?? [])) {
            const newDeg = (inDegree.get(succ) ?? 1) - 1;
            inDegree.set(succ, newDeg);
            if (newDeg === 0) {
                queue.push(succ);
            }
        }
    }

    // If cycle detected — return empty (defensive guard)
    if (sortedNames.length !== tasks.length) return [];

    const taskByName = new Map<string, Task>();
    for (const task of tasks) taskByName.set(task.name, task);

    // Forward pass
    const esMap = new Map<string, number>();
    const efMap = new Map<string, number>();

    for (const name of sortedNames) {
        const task = taskByName.get(name)!;
        const preds = predecessorMap.get(name) ?? [];
        const es = preds.length === 0
            ? 0
            : Math.max(...preds.map(p => efMap.get(p) ?? 0));
        const ef = es + task.duration;
        esMap.set(name, es);
        efMap.set(name, ef);
    }

    // Project duration = max EF of all tasks
    const maxEF = Math.max(...[...efMap.values()]);

    // Backward pass
    const lsMap = new Map<string, number>();
    const lfMap = new Map<string, number>();

    for (const name of [...sortedNames].reverse()) {
        const task = taskByName.get(name)!;
        const succs = successorMap.get(name) ?? [];
        const lf = succs.length === 0
            ? maxEF
            : Math.min(...succs.map(s => lsMap.get(s) ?? maxEF));
        const ls = lf - task.duration;
        lfMap.set(name, lf);
        lsMap.set(name, ls);
    }

    // Build results in original task order
    return tasks.map(task => {
        const es = esMap.get(task.name) ?? 0;
        const ef = efMap.get(task.name) ?? 0;
        const ls = lsMap.get(task.name) ?? 0;
        const lf = lfMap.get(task.name) ?? 0;
        const float = ls - es;
        return {
            id: task.id,
            name: task.name,
            duration: task.duration,
            es,
            ef,
            ls,
            lf,
            float,
            critical: float === 0,
        };
    });
}
