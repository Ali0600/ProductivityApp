import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from "@react-native-async-storage/async-storage";


/*const getIndexOfList = async () => {
    const currentList = await AsyncStorage.getItem('currentList');
    return lists.findIndex(list => list.listName === currentList);
}*/
const LeftSwipeComponent = ({index, setTaskItems, taskItems, closeSwipe, onTaskItemsUpdated, currentListIndex}) =>{ 
     
    const handleLeftSwipe = async () => {

        const listData = await AsyncStorage.getItem('lists');
        const lists = JSON.parse(listData);
        console.log("Lists: ", lists);
        //const currentList = await AsyncStorage.getItem('currentList');
        //const getIndexOfList = () => {
          //  return lists.findIndex(list => list.listName === currentList);
        //}
        const [swipedTask] = lists[getIndexOfList()].splice(index, 1); 
        //const newTaskItems = [...taskItems];
        //console.log("New taskItems:" + newTaskItems[index].taskName);
        //const [swipedTask] = newTaskItems.splice(index, 1);
        //swipedTask.creationTime = new Date();
        //newTaskItems.push(swipedTask);
        //newTaskItems.sort((a,b) => a.creationTime - b.creationTime);
        //setTaskItems(newTaskItems);
        closeSwipe();
        //onTaskItemsUpdated(newTaskItems);
        };
    return(
        <TouchableOpacity style={styles.completeBox} onPress={handleLeftSwipe}>
            <View>
                <Text>Complete</Text>
            </View>
        </TouchableOpacity>
    );    
};

const RightSwipeComponent = ({index, setTaskItems, taskItems, closeSwipe}) => {
    const handleRightSwipe = () =>{
        const newTaskItems = [...taskItems];
        newTaskItems.splice(index, 1);
        setTaskItems(newTaskItems);
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

const Task = ({text, creationTime, index, setTaskItems, taskItems, currentListIndex}) => {
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
                    <RightSwipeComponent index={index} setTaskItems={setTaskItems} taskItems={taskItems} closeSwipe={closeSwipe}/>
                )} 
                renderLeftActions={() => (
                    <LeftSwipeComponent index={index} setTaskItems={setTaskItems} taskItems={taskItems} closeSwipe={closeSwipe} currentListIndex={currentListIndex}/>
                )}>
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
        flex: 0.2
    },
    completeBox: {
        backgroundColor: "green",

    }
})

export default Task;