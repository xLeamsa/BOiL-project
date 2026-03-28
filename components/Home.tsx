import React, { useEffect, useState } from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { computeCpm, type CpmResult, type Task } from '../utils/cpm';
import { showAlert } from '../utils/alert';
import { computeLayout, type GraphLayout } from '../utils/graphLayout';
import CpmGraph from './CpmGraph';
import CpmResultTable from './CpmResultTable';

export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [selectedPrecedents, setSelectedPrecedents] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [cpmResults, setCpmResults] = useState<CpmResult[] | null>(null);
    const [graphLayout, setGraphLayout] = useState<GraphLayout | null>(null);

    // Reset CPM results whenever tasks change
    useEffect(() => {
        setCpmResults(null);
        setGraphLayout(null);
    }, [tasks]);

    const handleSaveTask = () => {
        if (!name || !duration) {
            showAlert("Błąd", "Nazwa i czas trwania są wymagane!");
            return;
        }

        const isDuplicate = tasks.some(t => t.name === name && t.id !== editingId);
        if (isDuplicate) {
            showAlert("Błąd", `Czynność o nazwie "${name}" już istnieje!`);
            return;
        }

        if (editingId) {
            setTasks(tasks.map(t => t.id === editingId ? {
                ...t, name, duration: parseFloat(duration), precedents: selectedPrecedents
            } : t));
            setEditingId(null);
        } else {
            const newTask: Task = {
                id: Math.random().toString(),
                name,
                duration: parseFloat(duration),
                precedents: selectedPrecedents,
            };
            setTasks([...tasks, newTask]);
        }

        setName('');
        setDuration('');
        setSelectedPrecedents([]);
    };

    const startEdit = (task: Task) => {
        setEditingId(task.id);
        setName(task.name);
        setDuration(task.duration.toString());
        setSelectedPrecedents(task.precedents);
    };

    const togglePrecedent = (taskName: string) => {
        if (taskName === name) return;
        if (selectedPrecedents.includes(taskName)) {
            setSelectedPrecedents(selectedPrecedents.filter(p => p !== taskName));
        } else {
            setSelectedPrecedents([...selectedPrecedents, taskName]);
        }
    };

    const handleDurationChange = (text: string) => {
        // Allow only digits and a single decimal point
        const filtered = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        setDuration(filtered);
    };

    const handleCalculateCpm = () => {
        if (tasks.length === 0) return;

        const startTasks = tasks.filter(t => t.precedents.length === 0);
        const referencedNames = new Set(tasks.flatMap(t => t.precedents));
        const endTasks = tasks.filter(t => !referencedNames.has(t.name));

        const warnings: string[] = [];

        if (startTasks.length > 1) {
            warnings.push(`⚠ Wiele czynności startowych (${startTasks.map(t => t.name).join(', ')}). W klasycznej CPM zaleca się jedno zdarzenie początkowe.`);
        }
        if (endTasks.length > 1) {
            warnings.push(`⚠ Wiele czynności końcowych (${endTasks.map(t => t.name).join(', ')}). W klasycznej CPM zaleca się jedno zdarzenie końcowe.`);
        }

        const results = computeCpm(tasks);
        const layout = computeLayout(results, tasks);
        setCpmResults(results);
        setGraphLayout(layout);

        if (warnings.length > 0) {
            showAlert('Uwaga', warnings.join('\n\n'));
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>CPM Project Manager</Text>

            {/* Form */}
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Nazwa czynności (np. A)"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Czas trwania"
                    value={duration}
                    onChangeText={handleDurationChange}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Wybierz poprzedników:</Text>
                <View style={styles.precedentsContainer}>
                    {tasks.filter(t => t.id !== editingId).map(t => (
                        <TouchableOpacity
                            key={t.id}
                            style={[
                                styles.chip,
                                selectedPrecedents.includes(t.name) && styles.chipSelected
                            ]}
                            onPress={() => togglePrecedent(t.name)}
                        >
                            <Text style={selectedPrecedents.includes(t.name) ? styles.chipTextSelected : styles.chipText}>
                                {t.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {tasks.length === 0 && <Text style={{ color: '#999' }}>Najpierw dodaj jakieś czynności</Text>}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
                    <Text style={styles.saveButtonText}>
                        {editingId ? "Zaktualizuj czynność" : "Dodaj czynność"}
                    </Text>
                </TouchableOpacity>

                {editingId && (
                    <TouchableOpacity onPress={() => { setEditingId(null); setName(''); setDuration(''); setSelectedPrecedents([]); }}>
                        <Text style={styles.cancelText}>Anuluj edycję</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Task table */}
            <View style={styles.listContainer}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerText, { flex: 1 }]}>Czynność</Text>
                    <Text style={[styles.headerText, { flex: 1 }]}>Czas</Text>
                    <Text style={[styles.headerText, { flex: 1 }]}>Poprz.</Text>
                    <Text style={[styles.headerText, { width: 100 }]}>Akcje</Text>
                </View>

                <FlatList
                    data={tasks}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <View style={styles.tableRow}>
                            <Text style={styles.cell}>{item.name}</Text>
                            <Text style={styles.cell}>{item.duration}</Text>
                            <Text style={styles.cell}>{item.precedents.join(', ') || '-'}</Text>
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => startEdit(item)}>
                                    <Text style={styles.editText}>Edytuj</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setTasks(tasks.filter(t => t.id !== item.id))}>
                                    <Text style={styles.deleteText}>Usuń</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            </View>

            {/* Calculate CPM button */}
            {tasks.length > 0 && (
                <TouchableOpacity style={styles.cpmButton} onPress={handleCalculateCpm}>
                    <Text style={styles.cpmButtonText}>Oblicz CPM</Text>
                </TouchableOpacity>
            )}

            {/* CPM Graph */}
            {cpmResults && graphLayout && (
                <>
                    <Text style={styles.sectionTitle}>Diagram CPM</Text>
                    <CpmGraph layout={graphLayout} results={cpmResults} />

                    <Text style={styles.sectionTitle}>Wyniki CPM</Text>
                    <CpmResultTable results={cpmResults} />
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fefae0' },
    contentContainer: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    form: { marginBottom: 20, backgroundColor: '#e9edc9', padding: 15, borderRadius: 8 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#444' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 10, borderRadius: 4, backgroundColor: '#fff' },
    precedentsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#dda15e', marginRight: 5, marginBottom: 5 },
    chipSelected: { backgroundColor: '#bc6c25' },
    chipText: { color: '#333', fontSize: 12 },
    chipTextSelected: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    saveButton: { backgroundColor: '#283618', padding: 12, borderRadius: 4, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontWeight: 'bold' },
    cancelText: { textAlign: 'center', marginTop: 10, color: '#666' },
    listContainer: { marginBottom: 10 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderColor: '#eee', paddingBottom: 5 },
    headerText: { fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
    cell: { flex: 1 },
    actions: { flexDirection: 'row', width: 100, justifyContent: 'space-between' },
    editText: { color: '#2196F3', fontWeight: 'bold' },
    deleteText: { color: '#f44336', fontWeight: 'bold' },
    cpmButton: {
        backgroundColor: '#283618',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
    cpmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#283618',
        textAlign: 'center',
    },
});
