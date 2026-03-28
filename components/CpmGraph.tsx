import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { showAlert } from '../utils/alert';
import Svg, { Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import type { CpmResult } from '../utils/cpm';
import type { EdgeLayout, GraphLayout, NodeLayout } from '../utils/graphLayout';
import { NODE_HEIGHT, NODE_WIDTH } from '../utils/graphLayout';

interface Props {
    layout: GraphLayout;
    results: CpmResult[];
}

const COL_SIDE = 40;
const COL_MID = NODE_WIDTH - COL_SIDE * 2;  // 80px
const ROW_H = NODE_HEIGHT / 2;              // 30px

const CRITICAL_FILL = '#ffe8e8';
const CRITICAL_STROKE = '#e63946';
const CRITICAL_TEXT = '#c1121f';
const NORMAL_FILL = '#fefae0';
const NORMAL_STROKE = '#283618';
const NORMAL_TEXT = '#283618';

const EDGE_CRITICAL = '#e63946';
const EDGE_NORMAL = '#555555';

// Descriptions shown in Alert when user taps a cell
const CELL_INFO: Record<string, { title: string; description: string }> = {
    es: {
        title: 'ES — Najwcześniejszy Start',
        description: 'Najwcześniejszy możliwy termin rozpoczęcia tej czynności.\n\nES = max(EF wszystkich poprzedników)\nDla pierwszej czynności: ES = 0',
    },
    name: {
        title: 'Nazwa czynności',
        description: 'Identyfikator czynności w sieci CPM.\n\nCzynności krytyczne (Luz = 0) wyróżnione są czerwoną ramką — tworzą krytyczną ścieżkę projektu.',
    },
    ef: {
        title: 'EF — Najwcześniejszy Koniec',
        description: 'Najwcześniejszy możliwy termin zakończenia tej czynności.\n\nEF = ES + czas trwania',
    },
    ls: {
        title: 'LS — Najpóźniejszy Start',
        description: 'Najpóźniejszy dopuszczalny termin rozpoczęcia czynności bez opóźnienia całego projektu.\n\nLS = LF − czas trwania',
    },
    luz: {
        title: 'Luz — Rezerwa Czasowa',
        description: 'Czas, o który można opóźnić czynność bez wpływu na termin zakończenia projektu.\n\nLuz = LS − ES\n\nLuz = 0 → czynność krytyczna\nLuz > 0 → czynność niekrytyczna',
    },
    lf: {
        title: 'LF — Najpóźniejszy Koniec',
        description: 'Najpóźniejszy dopuszczalny termin zakończenia czynności bez opóźnienia projektu.\n\nLF = min(LS wszystkich następników)\nDla ostatniej czynności: LF = czas trwania projektu',
    },
};

function NodeBox({
    node,
    result,
}: {
    node: NodeLayout;
    result: CpmResult;
}) {
    const { x, y } = node;
    const critical = result.critical;

    const fill = critical ? CRITICAL_FILL : NORMAL_FILL;
    const stroke = critical ? CRITICAL_STROKE : NORMAL_STROKE;
    const textColor = critical ? CRITICAL_TEXT : NORMAL_TEXT;

    const col0cx = x + COL_SIDE / 2;
    const col1cx = x + COL_SIDE + COL_MID / 2;
    const col2cx = x + COL_SIDE + COL_MID + COL_SIDE / 2;

    // +4 offset approximates vertical centering (baseline shift for ~11-12px font)
    const row0cy = y + ROW_H / 2 + 4;
    const row1cy = y + ROW_H + ROW_H / 2 + 4;

    const div1x = x + COL_SIDE;
    const div2x = x + COL_SIDE + COL_MID;

    const pressCell = (key: keyof typeof CELL_INFO) => {
        const info = CELL_INFO[key];
        showAlert(info.title, info.description);
    };

    return (
        <>
            {/* Background */}
            <Rect x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT} fill={fill} stroke={stroke} strokeWidth={2} rx={3} />

            {/* Horizontal divider */}
            <Line x1={x} y1={y + ROW_H} x2={x + NODE_WIDTH} y2={y + ROW_H} stroke={stroke} strokeWidth={1} />

            {/* Vertical dividers */}
            <Line x1={div1x} y1={y} x2={div1x} y2={y + NODE_HEIGHT} stroke={stroke} strokeWidth={1} />
            <Line x1={div2x} y1={y} x2={div2x} y2={y + NODE_HEIGHT} stroke={stroke} strokeWidth={1} />

            {/* Row 0: ES | NAME | EF */}
            <SvgText x={col0cx} y={row0cy} textAnchor="middle" fontSize={11} fontWeight="bold" fill={textColor}>{result.es}</SvgText>
            <SvgText x={col1cx} y={row0cy} textAnchor="middle" fontSize={12} fontWeight="bold" fill={textColor}>{result.name}</SvgText>
            <SvgText x={col2cx} y={row0cy} textAnchor="middle" fontSize={11} fontWeight="bold" fill={textColor}>{result.ef}</SvgText>

            {/* Row 1: LS | FLOAT | LF */}
            <SvgText x={col0cx} y={row1cy} textAnchor="middle" fontSize={11} fontWeight="bold" fill={textColor}>{result.ls}</SvgText>
            <SvgText x={col1cx} y={row1cy} textAnchor="middle" fontSize={10} fontWeight="bold" fill={textColor}>luz: {result.float}</SvgText>
            <SvgText x={col2cx} y={row1cy} textAnchor="middle" fontSize={11} fontWeight="bold" fill={textColor}>{result.lf}</SvgText>

            {/* Transparent pressable hit areas on top */}
            <Rect x={x} y={y} width={COL_SIDE} height={ROW_H} fill="transparent" onPress={() => pressCell('es')} />
            <Rect x={div1x} y={y} width={COL_MID} height={ROW_H} fill="transparent" onPress={() => pressCell('name')} />
            <Rect x={div2x} y={y} width={COL_SIDE} height={ROW_H} fill="transparent" onPress={() => pressCell('ef')} />
            <Rect x={x} y={y + ROW_H} width={COL_SIDE} height={ROW_H} fill="transparent" onPress={() => pressCell('ls')} />
            <Rect x={div1x} y={y + ROW_H} width={COL_MID} height={ROW_H} fill="transparent" onPress={() => pressCell('luz')} />
            <Rect x={div2x} y={y + ROW_H} width={COL_SIDE} height={ROW_H} fill="transparent" onPress={() => pressCell('lf')} />
        </>
    );
}

function Arrow({ edge }: { edge: EdgeLayout }) {
    const color = edge.critical ? EDGE_CRITICAL : EDGE_NORMAL;
    const sw = edge.critical ? 2.5 : 1.5;

    const ax = edge.x2;
    const ay = edge.y2;
    const arrowPoints = `${ax},${ay} ${ax - 10},${ay - 5} ${ax - 10},${ay + 5}`;

    return (
        <>
            <Line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2 - 9}
                y2={edge.y2}
                stroke={color}
                strokeWidth={sw}
            />
            <Polygon points={arrowPoints} fill={color} />
        </>
    );
}

export default function CpmGraph({ layout, results }: Props) {
    const resultByName = new Map<string, CpmResult>();
    for (const r of results) resultByName.set(r.name, r);

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                style={styles.outerScroll}
                contentContainerStyle={{ width: Math.max(layout.totalWidth, 1) }}
                showsHorizontalScrollIndicator
            >
                <ScrollView
                    style={{ width: layout.totalWidth }}
                    contentContainerStyle={{ height: layout.totalHeight }}
                    showsVerticalScrollIndicator
                >
                    <Svg width={layout.totalWidth} height={layout.totalHeight}>
                        {layout.edges.map((edge, i) => (
                            <Arrow key={i} edge={edge} />
                        ))}
                        {layout.nodes.map(node => {
                            const result = resultByName.get(node.taskName);
                            if (!result) return null;
                            return <NodeBox key={node.taskName} node={node} result={result} />;
                        })}
                    </Svg>
                </ScrollView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: 'transparent',
    },
    outerScroll: {
        maxHeight: 350,
    },
});
