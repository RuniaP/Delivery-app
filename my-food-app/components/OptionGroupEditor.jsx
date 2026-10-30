import React from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const digitsOnly = (text) => text.replace(/\D/g, '');

// group = { key, id?, name, required, multiple, maxSelect, options: [{ key, id?, name, price }] }
// price và maxSelect là chuỗi (đang gõ), được đổi sang số khi lưu.
export default function OptionGroupEditor({ group, onChange, onRemove, createKey }) {
  const update = (changes) => onChange({ ...group, ...changes });

  const updateOption = (optionKey, changes) =>
    update({
      options: group.options.map((option) =>
        option.key === optionKey ? { ...option, ...changes } : option
      ),
    });

  const addOption = () =>
    update({ options: [...group.options, { key: createKey(), name: '', price: '' }] });

  const removeOption = (optionKey) =>
    update({ options: group.options.filter((option) => option.key !== optionKey) });

  return (
    <View style={styles.card}>
      <View style={styles.nameRow}>
        <TextInput
          style={[styles.input, styles.groupName]}
          placeholder="Tên nhóm (vd: Kích cỡ, Topping)"
          value={group.name}
          onChangeText={(name) => update({ name })}
        />
        <TouchableOpacity onPress={onRemove} hitSlop={8}>
          <Ionicons name="trash-outline" size={22} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Bắt buộc chọn</Text>
        <Switch
          value={group.required}
          onValueChange={(required) => update({ required })}
          trackColor={{ true: '#f2a3a3' }}
          thumbColor={group.required ? '#d32f2f' : '#f4f3f4'}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Cho phép chọn nhiều</Text>
        <Switch
          value={group.multiple}
          onValueChange={(multiple) => update({ multiple })}
          trackColor={{ true: '#f2a3a3' }}
          thumbColor={group.multiple ? '#d32f2f' : '#f4f3f4'}
        />
      </View>

      {group.multiple && (
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Chọn tối đa</Text>
          <TextInput
            style={[styles.input, styles.maxInput]}
            keyboardType="number-pad"
            value={group.maxSelect}
            onChangeText={(text) => update({ maxSelect: digitsOnly(text) })}
          />
        </View>
      )}

      <Text style={styles.optionsTitle}>Các lựa chọn</Text>
      {group.options.map((option) => (
        <View key={option.key} style={styles.optionRow}>
          <TextInput
            style={[styles.input, styles.optionName]}
            placeholder="Tên lựa chọn"
            value={option.name}
            onChangeText={(name) => updateOption(option.key, { name })}
          />
          <TextInput
            style={[styles.input, styles.optionPrice]}
            placeholder="+ giá (đ)"
            keyboardType="number-pad"
            value={option.price}
            onChangeText={(text) => updateOption(option.key, { price: digitsOnly(text) })}
          />
          <TouchableOpacity onPress={() => removeOption(option.key)} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color="#bbb" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addOption} onPress={addOption}>
        <Ionicons name="add-circle-outline" size={20} color="#d32f2f" />
        <Text style={styles.addOptionText}>Thêm lựa chọn</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#fafafa',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 6,
    fontSize: 15,
    color: '#111',
  },
  groupName: { flex: 1, fontWeight: '700', marginRight: 12 },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchLabel: { fontSize: 14, color: '#333' },
  maxInput: { width: 60, textAlign: 'center' },

  optionsTitle: { fontSize: 13, color: '#888', marginTop: 14 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  optionName: { flex: 1, marginRight: 10 },
  optionPrice: { width: 90, marginRight: 8, textAlign: 'right' },
  addOption: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  addOptionText: { color: '#d32f2f', fontWeight: '600', marginLeft: 6 },
});
