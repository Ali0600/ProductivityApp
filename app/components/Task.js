import { memo, useRef, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

const Task = ({ text, creationTime, index, taskId, onRemove, onComplete, onUpdate }) => {
    const swipeableRef = useRef(null);

    // For debugging - show when component mounts
    useEffect(() => {
        console.log(`Task mounted: ${text} with ID: ${taskId}`);
        return () => console.log(`Task unmounted: ${text} with ID: ${taskId}`);
    }, []);

    const closeSwipe = () => {
        if (swipeableRef.current) {
            swipeableRef.current.close();
        }
    };

    const handleRemove = () => {
        Alert.alert(
            "Delete Task",
            `Are you sure you want to delete "${text}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: closeSwipe
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        onRemove(index);
                        closeSwipe();
                    }
                }
            ]
        );
    };

    const handleComplete = () => {
        Alert.alert(
            "Complete Task",
            `Marking "${text}" as complete and moving to bottom of list`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: closeSwipe
                },
                {
                    text: "Complete",
                    style: "default",
                    onPress: () => {
                        onComplete(index);
                        closeSwipe();
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        Alert.prompt(
            "Edit Task",
            "Enter new task name:",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Save",
                    onPress: (newText) => {
                        if (newText && newText.trim()) {
                            onUpdate(taskId, {
                                text: newText.trim(),
                                taskName: newText.trim()
                            });
                        }
                    }
                }
            ],
            "plain-text",
            text
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={() => (
                <TouchableOpacity style={styles.deleteBox} onPress={handleRemove}>
                    <View>
                        <Text style={styles.actionText}>Delete</Text>
                    </View>
                </TouchableOpacity>
            )}
            renderLeftActions={() => (
                <TouchableOpacity style={styles.completeBox} onPress={handleComplete}>
                    <View>
                        <Text style={styles.actionText}>Complete</Text>
                    </View>
                </TouchableOpacity>
            )}
        >
            <TouchableOpacity
                style={styles.taskContainer}
                onLongPress={handleEdit}
                delayLongPress={500}
            >
                <Text>{text}</Text>
                <Text>{creationTime.toString()}</Text>
            </TouchableOpacity>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    taskContainer: {
        backgroundColor: "white",
        flexDirection: "row",
        padding: 20,
        borderRadius: 20,
        borderColor: "black",
        justifyContent: "space-between"
    },
    deleteBox: {
        backgroundColor: "red",
        flex: 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    completeBox: {
        backgroundColor: "green",
        flex: 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    actionText: {
        color: 'white',
        fontWeight: 'bold'
    }
})

export default memo(Task);