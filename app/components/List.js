import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLists } from '../hooks/useAppState';


const RightSwipeComponent = ({ listName, closeSwipe }) => {
    // Use our custom hook to access list operations
    const { removeList } = useLists();
    
    const handleRightSwipe = () => {
        // Remove the list
        removeList(listName);
        closeSwipe();
    };
    
    return (
        <TouchableOpacity style={styles.deleteBox} onPress={handleRightSwipe}>
            <View>
                <Text>Delete</Text>
            </View>
        </TouchableOpacity>
    );
}

const List = ({ text, index, drag, isActive, onListPress }) => {
    const swipeableRef = useRef(null);
    // Use text as the list name
    const listName = text;
    
    const closeSwipe = () => {
        if (swipeableRef.current) {
            swipeableRef.current.close();
        }
    };

    const handlePress = () => {
        if (onListPress) {
            onListPress();
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Swipeable 
                ref={swipeableRef}
                renderRightActions={() => (
                    <RightSwipeComponent 
                        listName={listName} 
                        closeSwipe={closeSwipe}
                    />
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
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        backgroundColor: "white",
        flexDirection: "row",
        padding: 20,
        borderRadius: 20,
        borderColor: "black",
        textAlign: 'center',
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
    menuLists: {
        backgroundColor: "black",
        flex: 1,
    },
    dragHandle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 10,
        backgroundColor: '#CCCCCC',
    }
})

export default List;