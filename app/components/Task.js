import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Task = (props) => {
    return (
        <TouchableOpacity>
            <View style={styles.taskWrapper}>
                <Text style = {styles.font}>{props.taskText}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    taskWrapper: {
        flexDirection: 'row',
        backgroundColor: "black",
        padding: 20,
        marginBottom: 1
    },
    item: {
        backgroundColor: "white",
    },
    font: {
        color: "white"
    }
})

export default Task;