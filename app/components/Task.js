import { memo, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import GlassCard from './GlassCard';

const Task = ({ text, creationTime, index, taskId, onRemove, onComplete, onUpdate }) => {
    const swipeableRef = useRef(null);

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
            leftThreshold={100}
            rightThreshold={100}
            onSwipeableOpen={(direction) => {
                if (direction === 'right') {
                    handleComplete();
                } else if (direction === 'left') {
                    handleRemove();
                }
            }}
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
            <GlassCard style={styles.taskCard}>
                <TouchableOpacity
                    style={styles.taskContainer}
                    onLongPress={handleEdit}
                    delayLongPress={500}
                >
                    <Text>{text}</Text>
                    <Text>{creationTime.toString()}</Text>
                </TouchableOpacity>
            </GlassCard>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    taskCard: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    taskContainer: {
        flexDirection: "row",
        padding: 20,
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