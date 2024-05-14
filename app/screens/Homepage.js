import { useEffect, useState } from "react";
import { View, StyleSheet, Text, Modal, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList } from "react-native";
import Task from "../components/Task";
import List from "../components/List";
import AntDesignIcons from '@expo/vector-icons/AntDesign';
import EntypoIcons from '@expo/vector-icons/Entypo';
import FeatherIcons from '@expo/vector-icons/Feather'
import moment from "moment";
import AsyncStorage from '@react-native-async-storage/async-storage';

function Homepage(props){
    const [modalVisible, setModalVisible] = useState(false);
    const [menuVisible, setMenuPanalVisible] = useState(false);
    const [taskListVisible, setTaskListVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(moment());

    const [task, setTask] = useState('');
    const [currentList, setCurrentList] = useState('Tasks');
    const [lists, setLists] = useState([
        {
            listName: 'Tasks',
            tasks: [
                {taskName: "PushUps", creationTime: currentTime.toDate()},
            ]
        },
        {
            listName: 'Daily Habits',
            tasks: [
                {taskName: "Learn German", creationTime: currentTime.toDate()},
            ]
        }
    ]);

    //Used to clear AsyncStorage for testing purposes
    const clearAsyncStorage = async () => {
        try {
            await AsyncStorage.clear();
            console.log('AsyncStorage cleared successfully.');
        } catch (error) {
            console.error('Error clearing AsyncStorage:', error);
        }
    };

    //This useEffect is used to update the current time every 10 seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(moment());
        }, 10000);

        return() => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const getLists = async () => {
            try {
                console.log("useEffect getLists called");
                const list = await AsyncStorage.getItem('lists');
                console.log("TEST");
                const currList = await AsyncStorage.getItem('currentList');
                if (list) {
                    setLists(JSON.parse(list));
                }
                if (currList) {
                    setCurrentList(currList);
                }
            } catch (error) {
                console.error('Error getting lists from AsyncStorage:', error);
            }
        };
        getLists();
    }, []);

    useEffect(() => {
        const saveLists = async () => {
            try {
                console.log("Lists state saved to AsyncStorage.");
                await AsyncStorage.setItem('lists', JSON.stringify(lists));
            } catch (error) {
                console.error('Error saving lists to AsyncStorage:', error);
            }
        };
        saveLists();
    }, [lists]);

    const handleTaskItemsUpdate = async (newLists) => {
        try {
            await AsyncStorage.setItem('lists', JSON.stringify(newLists));
            setLists([...newLists]); // Updating state with a new array reference
        } catch (error) {
            console.error('Error updating task items:', error);
        }
    };

    const handleAddTask = async () => {
        const newTask = {taskName: task, creationTime: currentTime.toDate()};
        lists[getIndexOfList(currentList)].tasks.push(newTask);
        await AsyncStorage.setItem('lists', JSON.stringify(lists));
        await AsyncStorage.setItem('currentListIndex', JSON.stringify(getIndexOfList(currentList)));
        setModalVisible(false);
        //clearAsyncStorage();
    }

    const switchList = async (listName) => {
        //clearAsyncStorage();
        setCurrentList(listName);
        await AsyncStorage.setItem('currentList', listName);
        setMenuPanalVisible(false);
    }

    const addNewList = async (newListName) =>{
        setTaskListVisible(false);
        //clearAsyncStorage();
        const newList = {listName: newListName, tasks: []};
        switchList(newListName);
        lists.push(newList);
        await AsyncStorage.setItem('lists', JSON.stringify(lists));
    }

    const getIndexOfList = () => {
        return lists.findIndex(list => list.listName === currentList);
    }

    return(
        <View style={styles.container}>

            <Modal visible={modalVisible} animationType="slide" transparent={true}> 
                <View style={styles.modalContent}>
                    <TextInput
                            style={styles.inputForms}
                            onChangeText={text => setTask(text)}
                            placeholder={'Task Name'}
                            value={props.task}
                    />
                </View>

                <View style={styles.buttonWrapper}>
                        <TouchableOpacity>
                            <AntDesignIcons name='minuscircle' size={60} onPress={() => setModalVisible(false) }/>
                        </TouchableOpacity>

                        <TouchableOpacity >
                            <AntDesignIcons name='pluscircle' size={60} onPress={() => handleAddTask(task)}/>
                        </TouchableOpacity>
                </View>
            </Modal>

            <Modal visible={menuVisible} animationType="slide" transparent={true}>
                <SafeAreaView style={styles.menuContainer}>
                    <View flexDirection="row" justifyContent="space-between" backgroundColor="white">
                        <AntDesignIcons name='closecircle' size={40} backgroundColor='white' onPress={()=> setMenuPanalVisible(false)}/>

                        <Text backgroundColor="yellow">Lists</Text>

                        <AntDesignIcons name='pluscircle' size={40} onPress={() => setTaskListVisible(true)}/>
                    </View>
                    
                    {/*<View style={styles.menuLists}>
                        <ScrollView>
                            <View style={styles.menuLists}>
                                <ScrollView>
                                    {lists.map((list) => (
                                        <TouchableOpacity key={list.listName} onPress={() => switchList(list.listName)}>
                                            <Text style={styles.listWrapper}>{list.listName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </ScrollView>
                                </View>*/}
                    <View style={styles.menuLists}>
                        <ScrollView>
                            {lists.map((list, index) => (
                                <TouchableOpacity key={index} onPress={() => switchList(list.listName)}>
                                    <List
                                        text={list.listName}
                                        setTaskItems={(newTaskItems) => lists[index].tasks = newTaskItems}
                                        handleTaskItemsUpdate={handleTaskItemsUpdate}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </SafeAreaView>

                <Modal visible={taskListVisible} animationType="slide" transparent={true}>
                    <View style={styles.taskListModal}>
                        <TextInput
                                style={styles.inputForms}
                                onChangeText={text => setCurrentList(text)}
                                placeholder={'Task List Name'}
                                //value={listName}
                        />
                    </View>

                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity>
                            <AntDesignIcons name='minuscircle' size={60} onPress={() => setTaskListVisible(false) }/>
                        </TouchableOpacity>

                        <TouchableOpacity >
                            <AntDesignIcons name='pluscircle' size={60} onPress={() => addNewList(currentList)}/>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </Modal>

            <SafeAreaView style={styles.productName}>
                <View flexDirection="row" justifyContent="space-between">
                    <TouchableOpacity>
                       <EntypoIcons name='menu' size={40} onPress={() => setMenuPanalVisible(true)}/>
                    </TouchableOpacity>

                    <Text style={styles.textFont}>ADHDone</Text>

                    <TouchableOpacity>
                       <FeatherIcons name='settings' size={40}/>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView>
                {[
                    //console.log("Current List: " + currentList),
                    lists.find(list => list.listName === currentList)?.tasks.map((task, index) => (
                        <Task
                            text={task.taskName}
                            key={index}
                            index={index}
                            creationTime={moment(task.creationTime).fromNow()}
                            //setTaskItems={(newTaskItems) => setTasksByList(prevState => ({ ...prevState, [currentList]: newTaskItems }))}
                            setTaskItems={(newTaskItems) => lists[getIndexOfList(currentList)].tasks = newTaskItems}
                            //taskItems={tasksByList[currentList]}
                            taskItems={lists[getIndexOfList(currentList)].tasks}
                            currentListIndex={currentList}
                        />
                    ))
                ]}
            </ScrollView>

            <View style={styles.buttonWrapper}>
                <TouchableOpacity>
                    <AntDesignIcons name='pluscircle' size={60} onPress={() => setModalVisible(true)}/>
                </TouchableOpacity>
            </View>


            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>

            </KeyboardAvoidingView>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: "black",
      flex: 1,
    },
    productName: {
        backgroundColor: "white",
    },
    textFont: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        paddingTop: 4,
    },
    buttonWrapper: {
        position: "relative",
        width: "100%",
        paddingBottom: 35,
        paddingTop: 10,
        backgroundColor: "white",
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent:{
        backgroundColor: "white",
        flex: 1,
        margin: 20,
        marginTop: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "black"
    },
    taskListModal:{
        backgroundColor: "white",
        flex: 1,
        margin: 20,
        marginTop: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "black"
    },
    inputForms: {
        padding: 10,
        borderRadius: 1,
        borderColor: "black",
        borderWidth: 1,
    },
    menuContainer: {
        justifyContent: 'center',
        flexDirection: "column",
        flex: 1,
        justifyContent: "flex-start"
    },
    menuLists: {
        backgroundColor: "black",
        flex: 1,
    },
    listWrapper: {
        position: "relative",
        width: "100%",
        paddingBottom: 35,
        paddingTop: 10,
        backgroundColor: "white",
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    }
  })

export default Homepage;

//                                 <Text style={{ color: listName === currentList ? "red" : "white" }}>{listName}</Text>