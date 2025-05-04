import { useRef, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useListTasks } from '../hooks/useAppState';

// Delete these component definitions as we're now implementing the functionality directly in the Task component

const Task = ({ text, creationTime, index, currentListName, taskId }) => {
    const swipeableRef = useRef(null);
    // Use our custom hook to access task operations for the specified list
    const { 
        tasks, 
        removeTaskFromList,
        removeTaskFromListByIndex, 
        updateTaskInList, 
        completeTaskInList,
        completeTaskInListByIndex 
    } = useListTasks(currentListName);
    
    // If taskId is not provided, create a fallback ID
    const actualTaskId = taskId || `${text}-${index}`;
    
    console.log("Task component received:", { 
        text, 
        index, 
        currentListName, 
        taskId: actualTaskId 
    });
    
    // For debugging - show when component mounts
    useEffect(() => {
        console.log(`Task mounted: ${text} with ID: ${actualTaskId}`);
        return () => console.log(`Task unmounted: ${text} with ID: ${actualTaskId}`);
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
                        console.log("Removing task at index:", index);
                        // Use the index-based approach which is more reliable
                        removeTaskFromListByIndex(index);
                        console.log("Remove task by index function called");
                        closeSwipe();
                    }
                }
            ]
        );
    };
    
    const handleComplete = () => {
        // Display an alert to make it clear what's happening
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
                        console.log("Marking task as complete with index:", index);
                        // Use the index-based approach which is more reliable
                        completeTaskInListByIndex(index);
                        console.log("Complete task by index function called");
                        closeSwipe();
                    }
                }
            ]
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                <View style={styles.taskContainer}>
                    <Text>{text}</Text>
                    <Text>{creationTime.toString()}</Text>
                </View>
            </Swipeable>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    taskContainer: {
        backgroundColor: "white",
        flexDirection: "row",
        padding: 20,
        borderRadius: 20,
        borderColor: "black",
        textAlign: 'center',
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

export default Task;