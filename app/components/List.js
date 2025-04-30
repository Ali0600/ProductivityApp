import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View} from "react-native";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from "@react-native-async-storage/async-storage";


const RightSwipeComponent = ({index, text, setTaskItems, taskItems, closeSwipe, handleTaskItemsUpdate}) => {
    const handleRightSwipe = async () =>{
        console.log("HELLO");

        const listData = await AsyncStorage.getItem('lists');
        const lists = JSON.parse(listData);
        const getIndexOfList = (text) => {
            return lists.findIndex(list => list.listName === text);
        }
        lists.splice(getIndexOfList(text), 1);
        await AsyncStorage.setItem('lists', JSON.stringify(lists));
        handleTaskItemsUpdate(lists);
        closeSwipe();

    }
    return(
        <TouchableOpacity style={styles.deleteBox} onPress={handleRightSwipe}>
            <View>
                <Text>Delete</Text>
            </View>
        </TouchableOpacity>
    )
}

const List = ({text, index, setTaskItems, taskItems, handleTaskItemsUpdate, drag, isActive }) => {
    const swipeableRef = useRef(null);

    const closeSwipe = () => {
        if(swipeableRef.current){
            swipeableRef.current.close();
        }
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Swipeable ref={swipeableRef}
                renderRightActions={() => (
                    <RightSwipeComponent index={index} setTaskItems={setTaskItems} taskItems={taskItems} closeSwipe={closeSwipe} text={text} handleTaskItemsUpdate={handleTaskItemsUpdate}/>
                )}>
                <TouchableOpacity onLongPress={drag} style={[styles.listContainer, isActive && styles.activeItem]}>
                    <Text>{text}</Text>
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
})

export default List;