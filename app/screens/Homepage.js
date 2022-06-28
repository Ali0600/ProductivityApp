import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Task from '../components/Task';

function Homepage(props) {
    return (
        <View style={styles.container}>
            <View style={styles.list}>
                <Text style={styles.textFont}>All Tasks</Text>

                <Task text="Task 1"></Task>
                <Task text="Task 2"></Task>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: "lightgray",
      flex: 1,
      paddingTop: StatusBar.currentHeight,
    },
    list: {
        backgroundColor: "darkgray",
        paddingTop: '10%',
        paddingHorizontal: '10%',
    },
    items: {
        width: "100%",
        height: "10%",
    },
    textFont: {
        fontSize: 24,
        fontWeight: "bold",
    }
  })

export default Homepage;