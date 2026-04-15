import { memo, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

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
        onRemove(text);
        closeSwipe();
    };

    const handleMove = () => {
        if (onMove) onMove(text);
        closeSwipe();
    };

    return (
        <Swipeable
            ref={swipeableRef}
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
                        <Text>Delete</Text>
                    </View>
                </TouchableOpacity>
            )}
        >
            <TouchableOpacity
                onLongPress={drag}
                onPress={handlePress}
                activeOpacity={0.7}
                style={[styles.listContainer, isActive && styles.activeItem]}
            >
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={styles.dragHandle} />
                    <Text>{text}</Text>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        backgroundColor: "white",
        flexDirection: "row",
        padding: 20,
        borderRadius: 20,
        borderColor: "black",
        justifyContent: "space-between"
    },
    activeItem: {
        backgroundColor: "#E8E8E8",
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
    dragHandle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#CCCCCC',
    }
})

export default memo(List);
