import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AntDesignIcons from '@expo/vector-icons/AntDesign';
import FeatherIcons from '@expo/vector-icons/Feather';
import Tile from '../components/Tile';
import { useMainLists, useAppLoading } from '../hooks/useAppState';

const LONG_NAME_THRESHOLD = 5;
const isLongName = (name) => (name?.length ?? 0) > LONG_NAME_THRESHOLD;

function TileGrid() {
  const { isLoading, error } = useAppLoading();
  const {
    mainLists,
    addMainList,
    removeMainList,
    renameMainList,
    switchMainList,
  } = useMainLists();

  const [addVisible, setAddVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const hero = mainLists[0];
  const rest = mainLists.slice(1);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (mainLists.some((ml) => ml.name === trimmed)) {
      Alert.alert('Duplicate', `A list called "${trimmed}" already exists.`);
      return;
    }
    addMainList(trimmed);
    setNewName('');
    setAddVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>ADHDone</Text>
        <TouchableOpacity onPress={() => {}}>
          <FeatherIcons name="settings" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {hero && (
            <View style={styles.heroItem}>
              <Tile
                name={hero.name}
                onPress={switchMainList}
                onRename={renameMainList}
                onDelete={removeMainList}
              />
            </View>
          )}

          <View style={styles.grid}>
            {rest.map((ml) => (
              <View
                key={ml.name}
                style={isLongName(ml.name) ? styles.wideItem : styles.gridItem}
              >
                <Tile
                  name={ml.name}
                  onPress={switchMainList}
                  onRename={renameMainList}
                  onDelete={removeMainList}
                />
              </View>
            ))}
            <View style={styles.gridItem}>
              <Tile isPlus onPress={() => setAddVisible(true)} />
            </View>
          </View>
        </ScrollView>
      )}

      <Modal visible={addVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New List</Text>
            <TextInput
              style={styles.input}
              onChangeText={setNewName}
              value={newName}
              placeholder="List name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setNewName('');
                  setAddVisible(false);
                }}
              >
                <AntDesignIcons name="minuscircle" size={50} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd}>
                <AntDesignIcons name="pluscircle" size={50} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const GAP = 6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'black',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: GAP,
    paddingBottom: 40,
  },
  heroItem: {
    width: '100%',
    aspectRatio: 2,
    padding: GAP,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '33.3333%',
    aspectRatio: 1,
    padding: GAP,
  },
  wideItem: {
    width: '66.6666%',
    aspectRatio: 2,
    padding: GAP,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default TileGrid;
