import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Task = (props) => {
    return (
        <TouchableOpacity>
            <View text={props.text} style={styles.item} key={props.uniqueID}>
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
        borderRadius: 20,
        borderColor: "black",
        textAlign: 'center',
    },
    item2: {
        backgroundColor: "white",
        padding: 20,
    }
})

export default Task;