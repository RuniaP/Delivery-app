import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Image, Dimensions, StyleSheet } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BANNER_HEIGHT = 150;
const AUTO_SCROLL_MS = 4000;

// banners: [{ id, title, subtitle, backgroundColor, image? }]
// Vuốt ngang bằng tay hoặc để tự chuyển. Có image thì ảnh phủ kín banner.
export default function BannerCarousel({ banners }) {
  const listRef = useRef(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);

  const showIndex = (next) => {
    indexRef.current = next;
    setIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  useEffect(() => {
    if (banners.length < 2) return undefined;

    const timer = setInterval(() => {
      showIndex((indexRef.current + 1) % banners.length);
    }, AUTO_SCROLL_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Người dùng tự vuốt xong thì cập nhật vị trí hiện tại
  const handleScrollEnd = (event) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    indexRef.current = next;
    setIndex(next);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, position) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * position,
          index: position,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
            {item.image ? (
              <Image source={item.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </>
            )}
          </View>
        )}
      />

      <View style={styles.dots}>
        {banners.map((banner, position) => (
          <View key={banner.id} style={[styles.dot, position === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: BANNER_HEIGHT },
  slide: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#d32f2f' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 6 },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: 3,
  },
  dotActive: { backgroundColor: '#d32f2f', width: 18 },
});
