import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CpmResult } from '../utils/cpm';

interface Props {
    results: CpmResult[];
}

export default function CpmResultTable({ results }: Props) {
    return (
        <ScrollView style={styles.scroll}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={[styles.headerCell, { flex: 1.2 }]}>Czynność</Text>
                <Text style={[styles.headerCell, { flex: 0.8 }]}>Czas</Text>
                <Text style={[styles.headerCell, { flex: 0.8 }]}>ES</Text>
                <Text style={[styles.headerCell, { flex: 0.8 }]}>EF</Text>
                <Text style={[styles.headerCell, { flex: 0.8 }]}>LS</Text>
                <Text style={[styles.headerCell, { flex: 0.8 }]}>LF</Text>
                <Text style={[styles.headerCell, { flex: 0.8 }]}>Luz</Text>
                <Text style={[styles.headerCell, { flex: 1.2 }]}>Krytyczna</Text>
            </View>

            {results.map(r => (
                <View
                    key={r.id}
                    style={[styles.row, r.critical && styles.criticalRow]}
                >
                    <Text style={[styles.cell, { flex: 1.2 }, r.critical && styles.criticalText]}>
                        {r.name}
                    </Text>
                    <Text style={[styles.cell, { flex: 0.8 }, r.critical && styles.criticalText]}>
                        {r.duration}
                    </Text>
                    <Text style={[styles.cell, { flex: 0.8 }, r.critical && styles.criticalText]}>
                        {r.es}
                    </Text>
                    <Text style={[styles.cell, { flex: 0.8 }, r.critical && styles.criticalText]}>
                        {r.ef}
                    </Text>
                    <Text style={[styles.cell, { flex: 0.8 }, r.critical && styles.criticalText]}>
                        {r.ls}
                    </Text>
                    <Text style={[styles.cell, { flex: 0.8 }, r.critical && styles.criticalText]}>
                        {r.lf}
                    </Text>
                    <Text style={[styles.cell, { flex: 0.8 }, r.critical && styles.criticalText]}>
                        {r.float}
                    </Text>
                    <Text
                        style={[
                            styles.cell,
                            { flex: 1.2 },
                            r.critical ? styles.criticalBadge : styles.normalBadge,
                        ]}
                    >
                        {r.critical ? 'Tak' : 'Nie'}
                    </Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#606c38',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    headerCell: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 4,
        backgroundColor: '#fefae0',
        borderBottomWidth: 1,
        borderBottomColor: '#e0dcc8',
    },
    criticalRow: {
        backgroundColor: '#ffe8e8',
    },
    cell: {
        fontSize: 12,
        textAlign: 'center',
        color: '#283618',
    },
    criticalText: {
        color: '#c1121f',
        fontWeight: '600',
    },
    criticalBadge: {
        color: '#e63946',
        fontWeight: 'bold',
    },
    normalBadge: {
        color: '#283618',
    },
});
