import type { CpmResult, Task } from './cpm';

export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 60;
export const LEVEL_GAP = 80;
export const NODE_GAP = 20;
const PADDING = 20;

export interface NodeLayout {
    taskName: string;
    x: number;
    y: number;
    width: number;
    height: number;
    level: number;
}

export interface EdgeLayout {
    fromName: string;
    toName: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    critical: boolean;
}

export interface GraphLayout {
    nodes: NodeLayout[];
    edges: EdgeLayout[];
    totalWidth: number;
    totalHeight: number;
}

export function computeLayout(results: CpmResult[], tasks: Task[]): GraphLayout {
    if (tasks.length === 0) {
        return { nodes: [], edges: [], totalWidth: 0, totalHeight: 0 };
    }

    // Build predecessor map by name
    const predecessorMap = new Map<string, string[]>();
    for (const task of tasks) {
        predecessorMap.set(task.name, [...task.precedents]);
    }

    // Topological sort (Kahn's) to assign levels
    const inDegree = new Map<string, number>();
    const successorMap = new Map<string, string[]>();
    for (const task of tasks) {
        inDegree.set(task.name, task.precedents.length);
        if (!successorMap.has(task.name)) successorMap.set(task.name, []);
        for (const pred of task.precedents) {
            const s = successorMap.get(pred) ?? [];
            s.push(task.name);
            successorMap.set(pred, s);
        }
    }

    const levelMap = new Map<string, number>();
    const queue: string[] = [];
    for (const task of tasks) {
        if (inDegree.get(task.name) === 0) queue.push(task.name);
    }

    while (queue.length > 0) {
        const name = queue.shift()!;
        const preds = predecessorMap.get(name) ?? [];
        const level = preds.length === 0
            ? 0
            : Math.max(...preds.map(p => levelMap.get(p) ?? 0)) + 1;
        levelMap.set(name, level);

        for (const succ of (successorMap.get(name) ?? [])) {
            const newDeg = (inDegree.get(succ) ?? 1) - 1;
            inDegree.set(succ, newDeg);
            if (newDeg === 0) queue.push(succ);
        }
    }

    // Group by level
    const levelGroups = new Map<number, string[]>();
    for (const task of tasks) {
        const level = levelMap.get(task.name) ?? 0;
        const group = levelGroups.get(level) ?? [];
        group.push(task.name);
        levelGroups.set(level, group);
    }

    const maxLevel = Math.max(...[...levelMap.values()]);
    const maxNodesAtLevel = Math.max(...[...levelGroups.values()].map(g => g.length));

    const totalWidth = (maxLevel + 1) * (NODE_WIDTH + LEVEL_GAP) - LEVEL_GAP + 2 * PADDING;
    const totalHeight = maxNodesAtLevel * (NODE_HEIGHT + NODE_GAP) - NODE_GAP + 2 * PADDING;

    // Compute x, y for each node
    const nodeMap = new Map<string, NodeLayout>();

    for (const [level, names] of levelGroups.entries()) {
        const x = PADDING + level * (NODE_WIDTH + LEVEL_GAP);
        const groupHeight = names.length * NODE_HEIGHT + (names.length - 1) * NODE_GAP;
        const startY = PADDING + (totalHeight - 2 * PADDING - groupHeight) / 2;

        names.forEach((name, i) => {
            const y = startY + i * (NODE_HEIGHT + NODE_GAP);
            nodeMap.set(name, {
                taskName: name,
                x,
                y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                level,
            });
        });
    }

    // Build result map for critical flag lookup
    const resultByName = new Map<string, CpmResult>();
    for (const r of results) resultByName.set(r.name, r);

    // Build edges
    const edges: EdgeLayout[] = [];
    for (const task of tasks) {
        const toNode = nodeMap.get(task.name);
        if (!toNode) continue;
        for (const predName of task.precedents) {
            const fromNode = nodeMap.get(predName);
            if (!fromNode) continue;
            const fromResult = resultByName.get(predName);
            const toResult = resultByName.get(task.name);
            edges.push({
                fromName: predName,
                toName: task.name,
                x1: fromNode.x + NODE_WIDTH,
                y1: fromNode.y + NODE_HEIGHT / 2,
                x2: toNode.x,
                y2: toNode.y + NODE_HEIGHT / 2,
                critical: (fromResult?.critical ?? false) && (toResult?.critical ?? false),
            });
        }
    }

    return {
        nodes: [...nodeMap.values()],
        edges,
        totalWidth,
        totalHeight,
    };
}
