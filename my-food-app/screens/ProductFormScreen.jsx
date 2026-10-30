import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { pickImage, uploadProductImage } from '../lib/productImage';
import OptionGroupEditor from '../components/OptionGroupEditor';

const PRODUCT_COLUMNS = `
  id, name, description, image_url, base_price, category_id, tags,
  section:menu_sections(name),
  option_groups(id, name, min_select, max_select, sort_order,
    options(id, name, extra_price, sort_order))
`;

const bySortOrder = (a, b) => a.sort_order - b.sort_order;
const digitsOnly = (text) => text.replace(/\D/g, '');

export default function ProductFormScreen({ route, navigation }) {
  const productId = route.params?.productId ?? null;
  const { profile } = useAuth();
  const keyCounter = useRef(0);
  const createKey = () => {
    keyCounter.current += 1;
    return `k${keyCounter.current}`;
  };

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionName, setSectionName] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [pickedImage, setPickedImage] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  // Các mục menu cửa hàng đã tạo, hiện thành nút bấm nhanh
  useEffect(() => {
    supabase
      .from('menu_sections')
      .select('id, name')
      .eq('store_id', profile.store_id)
      .order('sort_order')
      .then(({ data }) => setSections(data ?? []));
  }, [profile.store_id]);

  // Sửa món: đổ dữ liệu hiện có vào form
  useEffect(() => {
    if (!productId) return;

    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('id', productId)
        .maybeSingle();

      if (data) {
        setName(data.name);
        setDescription(data.description ?? '');
        setPrice(String(Math.round(Number(data.base_price))));
        setCategoryId(data.category_id);
        setSectionName(data.section?.name ?? '');
        setImageUrl(data.image_url);
        setTagsText(data.tags.join(', '));
        setGroups(
          data.option_groups.sort(bySortOrder).map((group) => ({
            key: createKey(),
            id: group.id,
            name: group.name,
            required: group.min_select >= 1,
            multiple: group.max_select > 1,
            maxSelect: group.max_select > 1 ? String(group.max_select) : '3',
            options: group.options.sort(bySortOrder).map((option) => ({
              key: createKey(),
              id: option.id,
              name: option.name,
              price: String(Math.round(Number(option.extra_price))),
            })),
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  const choosePhoto = async () => {
    try {
      const asset = await pickImage();
      if (asset) setPickedImage(asset);
    } catch (error) {
      Alert.alert('Không chọn được ảnh', error.message);
    }
  };

  const addGroup = () =>
    setGroups((previous) => [
      ...previous,
      {
        key: createKey(),
        name: '',
        required: false,
        multiple: false,
        maxSelect: '3',
        options: [{ key: createKey(), name: '', price: '' }],
      },
    ]);

  const changeGroup = (updated) =>
    setGroups((previous) => previous.map((group) => (group.key === updated.key ? updated : group)));

  const removeGroup = (groupKey) =>
    setGroups((previous) => previous.filter((group) => group.key !== groupKey));

  const validate = () => {
    if (!name.trim()) return 'Vui lòng nhập tên món.';
    if (!price) return 'Vui lòng nhập giá món.';

    for (const group of groups) {
      if (!group.name.trim()) return 'Mỗi nhóm tùy chọn cần có tên (vd: Kích cỡ, Topping).';
      if (group.options.length === 0) return `Nhóm “${group.name}” cần ít nhất 1 lựa chọn.`;
      if (group.options.some((option) => !option.name.trim())) {
        return `Có lựa chọn chưa có tên trong nhóm “${group.name}”.`;
      }
      if (group.multiple && !(Number(group.maxSelect) >= 1)) {
        return `Nhóm “${group.name}”: số lựa chọn tối đa phải từ 1 trở lên.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      Alert.alert('Chưa lưu được', problem);
      return;
    }

    setSaving(true);
    try {
      const finalImageUrl = pickedImage
        ? await uploadProductImage(pickedImage, profile.store_id)
        : imageUrl;

      const payload = {
        id: productId,
        store_id: profile.store_id,
        category_id: categoryId,
        section_name: sectionName,
        name,
        description,
        image_url: finalImageUrl,
        base_price: Number(price),
        tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
        groups: groups.map((group) => ({
          id: group.id ?? null,
          name: group.name,
          min_select: group.required ? 1 : 0,
          max_select: group.multiple ? Number(group.maxSelect) : 1,
          options: group.options.map((option) => ({
            id: option.id ?? null,
            name: option.name,
            extra_price: Number(option.price || 0),
          })),
        })),
      };

      const { error } = await supabase.rpc('save_product', { payload });
      if (error) throw error;
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lưu món thất bại', error.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  const previewUri = pickedImage?.uri ?? imageUrl;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.photoBox} onPress={choosePhoto}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoEmpty}>
                <Ionicons name="camera-outline" size={36} color="#d32f2f" />
                <Text style={styles.photoHint}>Chọn ảnh món</Text>
              </View>
            )}
          </TouchableOpacity>
          {previewUri ? <Text style={styles.photoChange}>Bấm vào ảnh để đổi</Text> : null}

          <Text style={styles.label}>Tên món</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.label}>Giá (đ)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={price}
            onChangeText={(text) => setPrice(digitsOnly(text))}
          />

          <Text style={styles.label}>Mục trong menu của cửa hàng</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: Cà phê, Trà & Trà sữa, Món mới"
            value={sectionName}
            onChangeText={setSectionName}
          />
          {sections.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {sections.map((section) => {
                const selected = sectionName.trim().toLowerCase() === section.name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={section.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setSectionName(selected ? '' : section.name)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {section.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          <Text style={styles.fieldHint}>
            Bấm một mục có sẵn hoặc gõ tên mới. Đây là tiêu đề hiện trong menu của quán bạn.
          </Text>

          <Text style={styles.label}>Danh mục tìm kiếm</Text>
          <Text style={styles.fieldHint}>Do admin quản lý, giúp khách lọc và tìm món.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {categories.map((category) => {
              const selected = categoryId === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setCategoryId(selected ? null : category.id)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Tag phụ (cách nhau bằng dấu phẩy)</Text>
          <TextInput
            style={styles.input}
            placeholder="vd: gà rán, cay, combo"
            value={tagsText}
            onChangeText={setTagsText}
          />

          <Text style={styles.sectionTitle}>Nhóm tùy chọn</Text>
          <Text style={styles.sectionHint}>
            Vd: “Kích cỡ” (bắt buộc, chọn 1) hoặc “Topping” (không bắt buộc, chọn nhiều).
          </Text>
          {groups.map((group) => (
            <OptionGroupEditor
              key={group.key}
              group={group}
              onChange={changeGroup}
              onRemove={() => removeGroup(group.key)}
              createKey={createKey}
            />
          ))}
          <TouchableOpacity style={styles.addGroup} onPress={addGroup}>
            <Ionicons name="add-circle-outline" size={22} color="#d32f2f" />
            <Text style={styles.addGroupText}>Thêm nhóm tùy chọn</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Đang lưu...' : 'Lưu món'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },

  photoBox: { alignSelf: 'center' },
  photo: { width: 160, height: 160, borderRadius: 16 },
  photoEmpty: {
    width: 160,
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d32f2f',
    backgroundColor: '#fde8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { color: '#d32f2f', marginTop: 6, fontWeight: '600' },
  photoChange: { alignSelf: 'center', fontSize: 12, color: '#999', marginTop: 6 },

  label: { fontSize: 13, color: '#888', marginTop: 18 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    fontSize: 16,
    color: '#111',
  },
  fieldHint: { fontSize: 12, color: '#999', marginTop: 4 },
  chips: { marginTop: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  chipSelected: { backgroundColor: '#d32f2f' },
  chipText: { fontSize: 14, color: '#333', fontWeight: '500' },
  chipTextSelected: { color: '#fff' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginTop: 28 },
  sectionHint: { fontSize: 12, color: '#888', marginTop: 4 },
  addGroup: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  addGroupText: { color: '#d32f2f', fontWeight: '600', fontSize: 15, marginLeft: 6 },

  footer: { padding: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  saveButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#f2a3a3' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
