import { View, StyleSheet, Text, Modal, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";

function Homepage(props){

    return(
        <View style={styles.container}>

            <SafeAreaView style={styles.productNameContainer}>
                <Text style={styles.textFont}>Productivity App</Text>
            </SafeAreaView>

            <ScrollView>
                {

                }
            </ScrollView>

            <View style={styles.buttonWrapper}>
                <TouchableOpacity>
                    <Text style={styles.addButton}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "B5FFFF",
        flex: 1,
    },
    productNameContainer: {
        backgroundColor: "#80D8FF",
        alignItems: "center",
    },
    textFont: {
        fontSize: 24,
        fontWeight: "bold",
        paddingBottom: 10
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
    addButton: {
        fontSize: 60,

    }
})

export default Homepage;