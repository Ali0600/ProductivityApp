import { useMemo, useState } from 'react';
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

// Sort by user-set weight, descending. Stable within a tier (preserves insertion order).
const orderByWeight = (mainListsWithWeight) =>
  [...mainListsWithWeight].sort((a, b) => b.weight - a.weight);

function TileGrid() {
  const { isLoading, error } = useAppLoading();
  const {
    mainListsWithWeight,
    addMainList,
    removeMainList,
    renameMainList,
    setMainListWeight,
    switchMainList,
  } = useMainLists();

  const [addVisible, setAddVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const ordered = useMemo(() => orderByWeight(mainListsWithWeight), [
    mainListsWithWeight,
  ]);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (mainListsWithWeight.some((ml) => ml.name === trimmed)) {
      Alert.alert('Duplicate', `A list called "${trimmed}" already exists.`);
      return;
    }
    addMainList(trimmed);
    setNewName('');
    setAddVisible(false);
  };

  const renderHero = (big, smallA, smallB) => (
    <View style={styles.heroRow}>
      <View style={styles.heroBig}>
        <Tile
          name={big.name}
          weight={big.weight}
          onPress={switchMainList}
          onRename={renameMainList}
          onDelete={removeMainList}
          onSetWeight={setMainListWeight}
        />
      </View>
      <View style={styles.heroCol}>
        <View style={styles.heroSmall}>
          <Tile
            name={smallA.name}
            weight={smallA.weight}
            onPress={switchMainList}
            onRename={renameMainList}
            onDelete={removeMainList}
            onSetWeight={setMainListWeight}
          />
        </View>
        <View style={styles.heroSmall}>
          <Tile
            name={smallB.name}
            weight={smallB.weight}
            onPress={switchMainList}
            onRename={renameMainList}
            onDelete={removeMainList}
            onSetWeight={setMainListWeight}
          />
        </View>
      </View>
    </View>
  );

  const hasHero = ordered.length >= 3;
  const heroTiles = hasHero ? ordered.slice(0, 3) : [];
  const gridTiles = hasHero ? ordered.slice(3) : ordered;

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
          {hasHero && renderHero(heroTiles[0], heroTiles[1], heroTiles[2])}

          <View style={styles.grid}>
            {gridTiles.map((ml) => (
              <View key={ml.name} style={styles.gridItem}>
                <Tile
                  name={ml.name}
                  weight={ml.weight}
                  onPress={switchMainList}
                  onRename={renameMainList}
                  onDelete={removeMainList}
                  onSetWeight={setMainListWeight}
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
  heroRow: {
    flexDirection: 'row',
  },
  heroBig: {
    flex: 2,
    aspectRatio: 1,
    padding: GAP,
  },
  heroCol: {
    flex: 1,
    flexDirection: 'column',
  },
  heroSmall: {
    flex: 1,
    aspectRatio: 1,
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
