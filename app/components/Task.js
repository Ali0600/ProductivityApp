import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Task = (props) => {
    return (
        <View style={{flexDirection: 'row'}}>
            <View style={styles.complete}>
                
            </View>
            <TouchableOpacity>
                <View text={props.text} style={styles.item} key={props.uniqueID}>
                    <Text>{props.text}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    item: {
        backgroundColor: "white",
        flexDirection: "row",
        padding: 20,
        alignItems: "center",
        borderRadius: 20,
        borderColor: "black",
        margin: 5,
        flex: '75%'
    },
    complete: {
        backgroundColor: "green",
        flex: "25%",
        padding: 20,
        borderRadius: 20,
    }
})

export default Task;