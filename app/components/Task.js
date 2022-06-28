import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';

const Task = (props) => {
    return (
        <Button title={props.text} onPress={()=> {console.log(props.text)}}>
            <Text></Text>
        </Button>
    );
}

const styles = StyleSheet.create({
    item: {
        backgroundColor: "white",
        paddingTop: 50,

    }
})

export default Task;