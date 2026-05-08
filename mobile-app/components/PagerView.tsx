import React from 'react';
import { View } from 'react-native';
import NativePagerView from 'react-native-pager-view';

// Safety check for Expo Go environments where the library might be missing or misconfigured
const PagerView = NativePagerView || View;

export default PagerView;
