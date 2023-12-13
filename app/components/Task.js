import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import Swipeable from 'react-native-gesture-handler/Swipeable';

const LeftSwipeComponent = ({index, setTaskItems, taskItems, closeSwipe}) =>{  
    const handleLeftSwipe = () => {
        const newTaskItems = [...taskItems];
        const [swipedTask] = newTaskItems.splice(index, 1);
        swipedTask.creationTime = new Date();
        newTaskItems.push(swipedTask);
        newTaskItems.sort((a,b) => a.creationTime - b.creationTime);
        setTaskItems(newTaskItems)
        closeSwipe();
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

const Task = ({text, creationTime, index, setTaskItems, taskItems}) => {
    const swipeableRef = useRef(null);

    const closeSwipe = () => {
        if(swipeableRef.current){
            swipeableRef.current.close();
        }
    }

    return (
        <Swipeable ref={swipeableRef}
            renderRightActions={() => (
                <RightSwipeComponent index={index} setTaskItems={setTaskItems} taskItems={taskItems} closeSwipe={closeSwipe}/>
            )} 
            renderLeftActions={() => (
                <LeftSwipeComponent index={index} setTaskItems={setTaskItems} taskItems={taskItems} closeSwipe={closeSwipe}/>
            )}>
            <View style={styles.taskContainer}>
                <Text>{text}</Text>
                <Text>{creationTime.toString()}</Text>
            </View>
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