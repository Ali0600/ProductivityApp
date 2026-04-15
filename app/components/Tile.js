import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import AntDesignIcons from '@expo/vector-icons/AntDesign';

const Tile = ({ name, isPlus, onPress, onRename, onDelete, style, textStyle }) => {
  const handlePress = () => {
    if (onPress) onPress(name);
  };

  const handleLongPress = () => {
    if (isPlus) return;
    Alert.alert(name, 'Manage this list', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Rename',
        onPress: () => {
          Alert.prompt(
            'Rename List',
            'Enter a new name:',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Save',
                onPress: (newName) => {
                  const trimmed = (newName || '').trim();
                  if (trimmed && trimmed !== name && onRename) onRename(name, trimmed);
                },
              },
            ],
            'plain-text',
            name
          );
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete List', `Delete "${name}" and all its side lists?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => onDelete && onDelete(name),
            },
          ]);
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.tile, isPlus && styles.plusTile, style]}
      activeOpacity={0.7}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      {isPlus ? (
        <AntDesignIcons name="plus" size={40} color="#888" />
      ) : (
        <Text style={[styles.text, textStyle]} numberOfLines={2} adjustsFontSizeToFit>
          {name}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  plusTile: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: 'black',
    textAlign: 'center',
  },
});

export default memo(Tile);
