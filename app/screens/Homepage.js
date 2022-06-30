import React from 'react';
import { Text, StyleSheet, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Task from '../components/Task';
import Icons from '@expo/vector-icons/AntDesign';

function Homepage(props) {
    const Tasks = [ {text: "Workout Shoulders 1", uniqueID:"1"},
                    {text: "Workout Shoulders 2", uniqueID:"2"},
                    {text: "Workout Shoulders 3", uniqueID:"3"},
                    {text: "Workout Shoulders 4", uniqueID:"4"},
                    {text: "Workout Shoulders 5", uniqueID:"5"},
                    {text: "Workout Shoulders 6", uniqueID:"6"},
                    {text: "Workout Shoulders 7", uniqueID:"7"},
                    {text: "Workout Shoulders 8", uniqueID:"8"},
                    {text: "Workout Shoulders 9", uniqueID:"9"},
                    {text: "Workout Shoulders 10", uniqueID:"10"}];

    return (            
        <View style={styles.container}>
            <SafeAreaView style={styles.productName}>
                <Text style={styles.textFont}>ProductivityApp</Text>
            </SafeAreaView>

            <ScrollView>
                {
                    Tasks.map( (task) => <Task text={task.text} key={task.uniqueID}/> )
                }
            </ScrollView>
            
            <View style={styles.addButton}>
                <TouchableOpacity>
                    <Icons name='pluscircle' size={60} style={styles.icon}/>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: "#B5FFFF",
      flex: 1,
    },
    productName: {
        backgroundColor: "#80D8FF",
        alignItems: "center",
    },
    textFont: {
        fontSize: 24,
        fontWeight: "bold",
        paddingBottom: 10
    },
    addButton: {
        position: "relative",
        width: "100%",
        paddingBottom: 40,
        backgroundColor: "#80D8FF",
    },
    icon:{
        backgroundColor: "#80D8FF",
        position: "relative",
        paddingTop: 10,
        right: "-80%"
    }
  })

export default Homepage;