import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, StyleSheet, View, SafeAreaView } from 'react-native';
import Task from '../components/Task';

function Homepage(props) {
    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.productName}>
                <Text style={styles.textFont}>ProductivityApp</Text>
            </SafeAreaView>

            <Task text="Task 1"></Task>
            <Task text="Task 2"></Task>
            <Task text="Task 2"></Task>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: "white",
      flex: 1,
    },
    productName: {
        backgroundColor: "skyblue",
        alignItems: "center",
    },
    textFont: {
        fontSize: 24,
        fontWeight: "bold",
        paddingBottom: 10
    }
  })

export default Homepage;