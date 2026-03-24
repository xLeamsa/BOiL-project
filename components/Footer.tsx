import { StyleSheet, Text, View } from 'react-native';

export default function Footer() {
    return (
        <View style={styles.footer}>
            <Text style={styles.text}>© 2026 BOiL Project - Critical Path Method</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    footer: {
        width: '100%',
        padding: 15,
        backgroundColor: '#606c38',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    text: {
        fontSize: 12,
        color: '#fefae0',
    },
});