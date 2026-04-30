import { memo, useRef } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import GlassCard from './GlassCard';

const List = ({ text, drag, isActive, onSelect, onRemove, onMove }) => {
    const swipeableRef = useRef(null);

    const closeSwipe = () => {
        if (swipeableRef.current) {
            swipeableRef.current.close();
        }
    };

    const handlePress = () => {
        if (onSelect) {
            onSelect(text);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete List',
            `Delete "${text}" and all its tasks?`,
            [
                { text: 'Cancel', style: 'cancel', onPress: closeSwipe },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        onRemove(text);
                        closeSwipe();
                    },
                },
            ]
        );
    };

    const handleMove = () => {
        if (onMove) onMove(text);
        closeSwipe();
    };

    return (
        <Swipeable
            ref={swipeableRef}
            leftThreshold={100}
            rightThreshold={100}
            onSwipeableOpen={(direction) => {
                if (direction === 'right') {
                    handleMove();
                } else if (direction === 'left') {
                    handleDelete();
                }
            }}
            renderLeftActions={() => (
                <TouchableOpacity style={styles.moveBox} onPress={handleMove}>
                    <View>
                        <Text style={styles.moveText}>Move</Text>
                    </View>
                </TouchableOpacity>
            )}
            renderRightActions={() => (
                <TouchableOpacity style={styles.deleteBox} onPress={handleDelete}>
                    <View>
                        <Text style={styles.deleteText}>Delete</Text>
                    </View>
                </TouchableOpacity>
            )}
        >
            <GlassCard
                style={[styles.listCard, isActive && styles.activeItem]}
                tintColor={isActive ? 'rgba(255,255,255,0.3)' : undefined}
            >
                <TouchableOpacity
                    onLongPress={drag}
                    onPress={handlePress}
                    activeOpacity={0.7}
                    style={styles.listContainer}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <View style={styles.dragHandle} />
                        <Text style={styles.listText}>{text}</Text>
                    </View>
                </TouchableOpacity>
            </GlassCard>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    listCard: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    listContainer: {
        flexDirection: "row",
        padding: 20,
        justifyContent: "space-between"
    },
    activeItem: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    deleteBox: {
        backgroundColor: "red",
        flex: 0.2
    },
    moveBox: {
        backgroundColor: "#1E90FF",
        flex: 0.2,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    moveText: {
        color: 'white',
        fontWeight: 'bold',
    },
    deleteText: {
        color: 'white',
        fontWeight: 'bold',
    },
    listText: {
        color: 'white',
    },
    dragHandle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#CCCCCC',
    }
})

export default memo(List);
