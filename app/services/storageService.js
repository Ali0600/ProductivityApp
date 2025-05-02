import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage service for handling AsyncStorage operations
 * Provides methods for reading and writing data with.
 */
export default class StorageService {
  /**
   * Get data from AsyncStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {Promise<any>} - Parsed data or default value
   */
  static async getData(key, defaultValue = null) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Store data in AsyncStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<boolean>} - Success status
   */
  static async storeData(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error(`Error storing ${key} to storage:`, error);
      return false;
    }
  }

  /**
   * Remove data from AsyncStorage
   * @param {string} key - Storage key to remove
   * @returns {Promise<boolean>} - Success status
   */
  static async removeData(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  }

  /**
   * Get all lists from storage
   * @returns {Promise<Array>} - Array of lists or empty array
   */
  static async getLists() {
    return this.getData('lists', []);
  }

  /**
   * Get current active list from storage
   * @returns {Promise<string>} - Current list name or empty string
   */
  static async getCurrentList() {
    return this.getData('currentList', '');
  }

  /**
   * Save lists to storage
   * @param {Array} lists - Lists to save
   * @returns {Promise<boolean>} - Success status
   */
  static async saveLists(lists) {
    return this.storeData('lists', lists);
  }

  /**
   * Save current list to storage
   * @param {string} currentList - Current list name
   * @returns {Promise<boolean>} - Success status
   */
  static async saveCurrentList(currentList) {
    return this.storeData('currentList', currentList);
  }
}