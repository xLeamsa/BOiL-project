import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Task {
    id: string;
    name: string;
    duration: number;
    precedents: string[]; // Teraz jako tablica nazw
}

export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [selectedPrecedents, setSelectedPrecedents] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Funkcja dodawania lub aktualizacji
    const handleSaveTask = () => {
        if (!name || !duration) {
            Alert.alert("Błąd", "Nazwa i czas trwania są wymagane!");
            return;
        }

        if (editingId) {
            // Edycja istniejącego
            setTasks(tasks.map(t => t.id === editingId ? {
                ...t, name, duration: parseFloat(duration), precedents: selectedPrecedents
            } : t));
            setEditingId(null);
        } else {
            // Dodawanie nowego
            const newTask: Task = {
                id: Math.random().toString(),
                name,
                duration: parseFloat(duration),
                precedents: selectedPrecedents,
            };
            setTasks([...tasks, newTask]);
        }

        // Reset formularza
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
        if (taskName === name) return; // Nie można być własnym poprzednikiem
        if (selectedPrecedents.includes(taskName)) {
            setSelectedPrecedents(selectedPrecedents.filter(p => p !== taskName));
        } else {
            setSelectedPrecedents([...selectedPrecedents, taskName]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>CPM Project Manager</Text>

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
                    onChangeText={setDuration}
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
        </View>
    );
}

const styles = StyleSheet.create({

    container: { flex: 1, padding: 20, backgroundColor: '#fefae0' },
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
    listContainer: { flex: 1 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderColor: '#eee', paddingBottom: 5 },
    headerText: { fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
    cell: { flex: 1 },
    actions: { flexDirection: 'row', width: 100, justifyContent: 'space-between' },
    editText: { color: '#2196F3', fontWeight: 'bold' },
    deleteText: { color: '#f44336', fontWeight: 'bold' },
});