import { useEffect, useState } from "react";
import { View, StyleSheet, Text, Modal, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList } from "react-native";
import Task from "../components/Task";
import AntDesignIcons from '@expo/vector-icons/AntDesign';
import EntypoIcons from '@expo/vector-icons/Entypo';
import FeatherIcons from '@expo/vector-icons/Feather'
import moment from "moment";

function Homepage(props){

    const [task, setTask] = useState('');
    const [taskItems, setTaskItems] = useState([]);
    const [creationTime, setCreationTime] = useState(new Date());
    const [modalVisible, setModalVisible] = useState(false);
    const[currentTime, setCurrentTime] = useState(moment());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(moment());
        }, 10000);

        return() => clearInterval(intervalId);
    }, []);

    const handleAddTask = () => {
        if (task){
            const newTask = {text: task, creationTime: currentTime.toDate()};
            setTaskItems([...taskItems, newTask].sort((a, b) => a.creationTime - b.creationTime));
            setTask('');
            setModalVisible(false);
        }
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
                            <AntDesignIcons name='pluscircle' size={60} onPress={() => handleAddTask()}/>
                        </TouchableOpacity>
                </View>
            </Modal>

            <SafeAreaView style={styles.productName}>
                <View flexDirection="row" justifyContent="space-between">
                    <TouchableOpacity>
                       <EntypoIcons name='menu' size={40}/>
                    </TouchableOpacity>
                    <Text style={styles.textFont}>Productivity App</Text>
                    <TouchableOpacity>
                       <FeatherIcons name='settings' size={40}/>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView>
                {
                    taskItems.map( (task,index) => 
                    <Task text={task.text} key = {index} index={index} creationTime={moment(task.creationTime).fromNow()} setTaskItems={setTaskItems} taskItems={taskItems}/> )
                }
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
      backgroundColor: "#B5FFFF",
      flex: 1,
    },
    productName: {
        backgroundColor: "#80D8FF",
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
        paddingBottom: 30,
        paddingTop: 10,
        backgroundColor: "#80D8FF",
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
    inputForms: {
        padding: 10,
        borderRadius: 1,
        borderColor: "black",
        borderWidth: 1,
    }
  })

export default Homepage;