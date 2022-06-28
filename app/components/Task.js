import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';

const Task = (props) => {
    return (
        <Button title={props.text} style={styles.item}>
            <Text></Text>
        </Button>
    );
}

const styles = StyleSheet.create({
    item: {
        backgroundColor: "white",
        paddingTop: 20,

    }
})

export default Task;