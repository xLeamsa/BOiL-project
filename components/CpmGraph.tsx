import React, { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { showAlert } from '../utils/alert';
import Svg, { Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import type { CpmResult } from '../utils/cpm';
import type { EdgeLayout, GraphLayout, NodeLayout } from '../utils/graphLayout';
import { NODE_HEIGHT, NODE_WIDTH } from '../utils/graphLayout';

interface Props {
    layout: GraphLayout;
    results: CpmResult[];
}

type TooltipInfo = { title: string; description: string; value: string | number; mouseX: number; mouseY: number };

const COL_SIDE = 40;
const COL_MID = NODE_WIDTH - COL_SIDE * 2; 
const ROW_H = NODE_HEIGHT / 2;            
const GRAPH_HEIGHT = 350;                  

const CRITICAL_FILL       = '#ffe8e8';
const CRITICAL_FILL_HOVER = '#ffc5c5';
const CRITICAL_STROKE     = '#e63946';
const CRITICAL_TEXT       = '#c1121f';
const NORMAL_FILL         = '#fefae0';
const NORMAL_FILL_HOVER   = '#ede8c2';
const NORMAL_STROKE       = '#283618';
const NORMAL_TEXT         = '#283618';

const EDGE_CRITICAL = '#e63946';
const EDGE_NORMAL   = '#555555';

const FONT_FAMILY = Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : undefined;

const CELL_INFO: Record<string, { title: string; description: string }> = {
    es:   { title: 'ES — Najwcześniejszy Start',   description: 'Najwcześniejszy możliwy termin rozpoczęcia tej czynności.\n\nES = max(EF wszystkich poprzedników)\nDla pierwszej czynności: ES = 0' },
    name: { title: 'Nazwa czynności',               description: 'Identyfikator czynności w sieci CPM.\n\nCzynności krytyczne (Luz = 0) wyróżnione są czerwoną ramką — tworzą krytyczną ścieżkę projektu.' },
    ef:   { title: 'EF — Najwcześniejszy Koniec',   description: 'Najwcześniejszy możliwy termin zakończenia tej czynności.\n\nEF = ES + czas trwania' },
    ls:   { title: 'LS — Najpóźniejszy Start',      description: 'Najpóźniejszy dopuszczalny termin rozpoczęcia czynności bez opóźnienia całego projektu.\n\nLS = LF − czas trwania' },
    luz:  { title: 'Luz — Rezerwa Czasowa',         description: 'Czas, o który można opóźnić czynność bez wpływu na termin zakończenia projektu.\n\nLuz = LS − ES\n\nLuz = 0 → czynność krytyczna\nLuz > 0 → czynność niekrytyczna' },
    lf:   { title: 'LF — Najpóźniejszy Koniec',     description: 'Najpóźniejszy dopuszczalny termin zakończenia czynności bez opóźnienia projektu.\n\nLF = min(LS wszystkich następników)\nDla ostatniej czynności: LF = czas trwania projektu' },
};

// Inset so highlight rect never overlaps the 2px border/divider stroke
const INSET = 1;

const NodeBox = memo(function NodeBox({
    node,
    result,
    onCellHover,
}: {
    node: NodeLayout;
    result: CpmResult;
    onCellHover?: (info: TooltipInfo | null) => void;
}) {
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);
    const { x, y } = node;
    const critical = result.critical;

    const baseFill  = critical ? CRITICAL_FILL       : NORMAL_FILL;
    const hoverFill = critical ? CRITICAL_FILL_HOVER : NORMAL_FILL_HOVER;
    const stroke    = critical ? CRITICAL_STROKE     : NORMAL_STROKE;
    const textColor = critical ? CRITICAL_TEXT       : NORMAL_TEXT;

    const col0cx = x + COL_SIDE / 2;
    const col1cx = x + COL_SIDE + COL_MID / 2;
    const col2cx = x + COL_SIDE + COL_MID + COL_SIDE / 2;
    const row0cy = y + ROW_H / 2 + 4;
    const row1cy = y + ROW_H + ROW_H / 2 + 4;
    const div1x  = x + COL_SIDE;
    const div2x  = x + COL_SIDE + COL_MID;

    const getCellValue = (key: string): string | number => {
        switch (key) {
            case 'es':   return result.es;
            case 'ef':   return result.ef;
            case 'ls':   return result.ls;
            case 'lf':   return result.lf;
            case 'luz':  return result.float;
            case 'name': return result.name;
            default:     return '';
        }
    };

    const pressCell = (key: string) => {
        const info = CELL_INFO[key];
        showAlert(`${info.title}: ${getCellValue(key)}`, info.description);
    };

    const hoverIn = (key: string, e?: any) => {
        setHoveredCell(key);
        console.log('hoverIn', { key, event: e });
        const mouseX = e?.nativeEvent?.clientX ?? 0;
        const mouseY = e?.nativeEvent?.clientY ?? 0;
        onCellHover?.({ ...CELL_INFO[key], value: getCellValue(key), mouseX, mouseY });
    };

    const hoverOut = () => {
        setHoveredCell(null);
        onCellHover?.(null);
    };

    // Transparent event-only rect — no fill so it never covers anything
    const eventRect = (cx: number, cy: number, w: number, h: number, key: string) => {
        const webProps = Platform.OS === 'web'
            ? { onMouseEnter: (e: any) => hoverIn(key, e), onMouseLeave: hoverOut }
            : {};
        return (
            <Rect
                key={`ev-${key}`}
                x={cx} y={cy} width={w} height={h}
                fill="transparent"
                onPress={() => pressCell(key)}
                {...(webProps as any)}
            />
        );
    };

    // Highlight rect — inset by 1px so it stays strictly inside border/divider strokes
    const highlightRect = (cx: number, cy: number, w: number, h: number, key: string) => (
        <Rect
            key={`hl-${key}`}
            x={cx + INSET} y={cy + INSET}
            width={w - INSET * 2} height={h - INSET * 2}
            fill={hoveredCell === key ? hoverFill : 'none'}
        />
    );

    return (
        <>
            {/* 1 — background + border */}
            <Rect x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT}
                fill={baseFill} stroke={stroke} strokeWidth={2} rx={3} />

            {/* 2 — cell highlights (inset, painted BEFORE lines & text so they stay below) */}
            {highlightRect(x,     y,         COL_SIDE, ROW_H, 'es')}
            {highlightRect(div1x, y,         COL_MID,  ROW_H, 'name')}
            {highlightRect(div2x, y,         COL_SIDE, ROW_H, 'ef')}
            {highlightRect(x,     y + ROW_H, COL_SIDE, ROW_H, 'ls')}
            {highlightRect(div1x, y + ROW_H, COL_MID,  ROW_H, 'luz')}
            {highlightRect(div2x, y + ROW_H, COL_SIDE, ROW_H, 'lf')}

            {/* 3 — divider lines (on top of highlights) */}
            <Line x1={x}    y1={y + ROW_H} x2={x + NODE_WIDTH} y2={y + ROW_H} stroke={stroke} strokeWidth={2} />
            <Line x1={div1x} y1={y} x2={div1x} y2={y + NODE_HEIGHT} stroke={stroke} strokeWidth={2} />
            <Line x1={div2x} y1={y} x2={div2x} y2={y + NODE_HEIGHT} stroke={stroke} strokeWidth={2} />

            {/* 4 — text (on top of highlights and lines) */}
            <SvgText x={col0cx} y={row0cy} textAnchor="middle" fontSize={11} fontWeight="bold" fontFamily={FONT_FAMILY} fill={textColor}>{result.es}</SvgText>
            <SvgText x={col1cx} y={row0cy} textAnchor="middle" fontSize={12} fontWeight="bold" fontFamily={FONT_FAMILY} fill={textColor}>{result.name}</SvgText>
            <SvgText x={col2cx} y={row0cy} textAnchor="middle" fontSize={11} fontWeight="bold" fontFamily={FONT_FAMILY} fill={textColor}>{result.ef}</SvgText>
            <SvgText x={col0cx} y={row1cy} textAnchor="middle" fontSize={11} fontWeight="bold" fontFamily={FONT_FAMILY} fill={textColor}>{result.ls}</SvgText>
            <SvgText x={col1cx} y={row1cy} textAnchor="middle" fontSize={10} fontWeight="bold" fontFamily={FONT_FAMILY} fill={textColor}>luz: {result.float}</SvgText>
            <SvgText x={col2cx} y={row1cy} textAnchor="middle" fontSize={11} fontWeight="bold" fontFamily={FONT_FAMILY} fill={textColor}>{result.lf}</SvgText>

            {/* 5 — transparent event rects (topmost, capture hover/click) */}
            {eventRect(x,     y,         COL_SIDE, ROW_H, 'es')}
            {eventRect(div1x, y,         COL_MID,  ROW_H, 'name')}
            {eventRect(div2x, y,         COL_SIDE, ROW_H, 'ef')}
            {eventRect(x,     y + ROW_H, COL_SIDE, ROW_H, 'ls')}
            {eventRect(div1x, y + ROW_H, COL_MID,  ROW_H, 'luz')}
            {eventRect(div2x, y + ROW_H, COL_SIDE, ROW_H, 'lf')}
        </>
    );
});

function Arrow({ edge }: { edge: EdgeLayout }) {
    const color = edge.critical ? EDGE_CRITICAL : EDGE_NORMAL;
    const sw    = edge.critical ? 3 : 2;
    const ax = edge.x2;
    const ay = edge.y2;
    return (
        <>
            <Line x1={edge.x1} y1={edge.y1} x2={ax - 9} y2={ay} stroke={color} strokeWidth={sw} />
            <Polygon points={`${ax},${ay} ${ax - 10},${ay - 5} ${ax - 10},${ay + 5}`} fill={color} />
        </>
    );
}

export default function CpmGraph({ layout, results }: Props) {
    const { width: screenWidth } = useWindowDimensions();
    const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const hide = () => setTooltip(null);
        window.addEventListener('scroll', hide, true);
        return () => window.removeEventListener('scroll', hide, true);
    }, []);

    const resultByName = new Map<string, CpmResult>();
    for (const r of results) resultByName.set(r.name, r);

    const graphWidth = Math.min(layout.totalWidth, screenWidth - 40);

    return (
        <>
        <View style={[styles.wrapper, { width: graphWidth }]}>
            <ScrollView
                horizontal
                style={[styles.outerScroll, Platform.OS === 'web' && { height: GRAPH_HEIGHT }]}
                contentContainerStyle={{ width: Math.max(layout.totalWidth, 1) }}
                showsHorizontalScrollIndicator
                onScroll={() => setTooltip(null)}
                scrollEventThrottle={16}
            >
                <ScrollView
                    style={{ width: layout.totalWidth }}
                    contentContainerStyle={{ height: layout.totalHeight }}
                    showsVerticalScrollIndicator
                    onScroll={() => setTooltip(null)}
                    scrollEventThrottle={16}
                >
                    <Svg width={layout.totalWidth} height={layout.totalHeight}>
                        {layout.edges.map((edge, i) => <Arrow key={i} edge={edge} />)}
                        {layout.nodes.map(node => {
                            const result = resultByName.get(node.taskName);
                            if (!result) return null;
                            return (
                                <NodeBox
                                    key={node.taskName}
                                    node={node}
                                    result={result}
                                    onCellHover={Platform.OS === 'web' ? setTooltip : undefined}
                                />
                            );
                        })}
                    </Svg>
                </ScrollView>
            </ScrollView>

        </View>
        {tooltip && Platform.OS === 'web' && createPortal(
            <View style={[styles.tooltip, { left: tooltip.mouseX - 160, top: tooltip.mouseY + 30 } as any]}>
                <View style={styles.tooltipHeader}>
                    <Text style={styles.tooltipTitle}>{tooltip.title}</Text>
                    <Text style={styles.tooltipValue}>{tooltip.value}</Text>
                </View>
                <Text style={styles.tooltipDesc}>{tooltip.description}</Text>
            </View>,
            document.body
        )}
            </>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: 'transparent',
        overflow: 'visible',
        width: '100%',
    },
    outerScroll: {
        maxHeight: GRAPH_HEIGHT,
    },
    tooltip: {
        position: 'fixed',
        zIndex: 9999,
        backgroundColor: '#283618',
        padding: 10,
        borderRadius: 6,
        maxWidth: 320,
        minWidth: 200,
    },
    tooltipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    tooltipTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        flexShrink: 1,
    },
    tooltipValue: {
        color: '#ffd166',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 10,
    },
    tooltipDesc: {
        color: '#dde',
        fontSize: 12,
        lineHeight: 18,
    },
});
