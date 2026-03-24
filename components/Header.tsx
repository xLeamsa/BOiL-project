import { StyleSheet, Text, View } from 'react-native';

export default function Header() {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>CPM Critical Path</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        width: '100%',
        height: 80,
        paddingTop: 30,
        backgroundColor: '#606c38',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: '#fefae0',
        fontSize: 20,
        fontWeight: 'bold',
    },
});