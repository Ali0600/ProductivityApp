import React from 'react';
import { Text, View, StyleSheet, Button, TouchableOpacity } from 'react-native';

const Task = (props) => {
    return (
        <TouchableOpacity>
            <View title={props.text} style={styles.item} key={props.uniqueID}>
                <Text>{props.text}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    item: {
        backgroundColor: "white",
        flexDirection: "row",
        padding: 20,
        alignItems: "center",
        borderRadius: 20,
        margin: 5,
    }
})

export default Task;