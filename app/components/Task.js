import { memo, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, Alert } from "react-native";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SymbolView } from 'expo-symbols';
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
                    <SymbolView name="trash.fill" size={28} tintColor="white" />
                </TouchableOpacity>
            )}
            renderLeftActions={() => (
                <TouchableOpacity style={styles.completeBox} onPress={handleComplete}>
                    <SymbolView name="checkmark.circle.fill" size={28} tintColor="white" />
                </TouchableOpacity>
            )}
        >
            <GlassCard
                style={styles.taskCard}
                colorScheme="dark"
                tintColor="rgba(46, 46, 80, 0.35)"
            >
                <TouchableOpacity
                    style={styles.taskContainer}
                    onLongPress={handleEdit}
                    delayLongPress={500}
                >
                    <Text style={styles.taskText}>{text}</Text>
                    <Text style={styles.taskTime}>{creationTime.toString()}</Text>
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
    taskText: {
        color: 'white',
    },
    taskTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    deleteBox: {
        width: 80,
        backgroundColor: 'rgba(200, 60, 60, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginVertical: 2,
        marginLeft: 8,
    },
    completeBox: {
        width: 80,
        backgroundColor: 'rgba(60, 160, 95, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginVertical: 2,
        marginRight: 8,
    },
})

export default memo(Task);