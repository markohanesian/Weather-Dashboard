import React from 'react';
import { ScrollView, View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * A simple web polyfill for PagerView using a horizontal ScrollView.
 */
const PagerViewWeb = React.forwardRef(({ children, initialPage = 0, style, onPageSelected }: any, ref: any) => {
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useImperativeHandle(ref, () => ({
    setPage: (page: number) => {
      scrollViewRef.current?.scrollTo({ x: page * width, animated: true });
    }
  }));

  const handleScroll = (event: any) => {
    if (onPageSelected) {
      const offset = event.nativeEvent.contentOffset.x;
      const pageWidth = event.nativeEvent.layoutMeasurement.width || width;
      const page = Math.round(offset / pageWidth);
      onPageSelected({ nativeEvent: { position: page } });
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      contentOffset={{ x: initialPage * width, y: 0 }}
    >
      {React.Children.map(children, (child) => (
        <View style={{ width }}>{child}</View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PagerViewWeb;
