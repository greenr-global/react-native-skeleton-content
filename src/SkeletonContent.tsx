/* eslint-disable react/function-component-definition */
import * as React from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  interpolateColor,
  interpolate,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  ICustomViewStyle,
  DEFAULT_ANIMATION_DIRECTION,
  DEFAULT_ANIMATION_TYPE,
  DEFAULT_BONE_COLOR,
  DEFAULT_BORDER_RADIUS,
  DEFAULT_DURATION,
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_LOADING,
  ISkeletonContentProps,
  IDirection,
} from './Constants';

// const { useCode, set, cond, eq } = Animated;
const { useState, useCallback } = React;

const styles = StyleSheet.create({
  absoluteGradient: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  gradientChild: {
    flex: 1,
  },
});

const useLayout = () => {
  const [size, setSize] = useState<any>({ width: 0, height: 0 });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  return [size, onLayout];
};

const SkeletonContent: React.FunctionComponent<ISkeletonContentProps> = ({
  containerStyle = styles.container,
  duration = DEFAULT_DURATION,
  layout = [],
  animationType = DEFAULT_ANIMATION_TYPE,
  animationDirection = DEFAULT_ANIMATION_DIRECTION,
  isLoading = DEFAULT_LOADING,
  boneColor = DEFAULT_BONE_COLOR,
  highlightColor = DEFAULT_HIGHLIGHT_COLOR,
  children,
}) => {
  let animationValue = useSharedValue(0);

  const [componentSize, onLayout] = useLayout();

  const backgroundPulseColor = useDerivedValue(() =>
    interpolateColor(
      animationValue.value,
      [0, 1],
      [boneColor!, highlightColor!]
    )
  );

  animationValue = useDerivedValue(() => {
    if (isLoading) return 0;
    if (animationType === 'shiver') {
      return withRepeat(withTiming(duration!), -1);
    }
    return withRepeat(withTiming(duration! / 2), -1);
  }, [isLoading, animationType, duration]);

  const getBoneWidth = (boneLayout: ICustomViewStyle): number =>
    (typeof boneLayout.width === 'string'
      ? componentSize.width
      : boneLayout.width) || 0;
  const getBoneHeight = (boneLayout: ICustomViewStyle): number =>
    (typeof boneLayout.height === 'string'
      ? componentSize.height
      : boneLayout.height) || 0;

  const getGradientEndDirection = (
    boneLayout: ICustomViewStyle
  ): IDirection => {
    let direction = { x: 0, y: 0 };
    if (animationType === 'shiver') {
      if (
        animationDirection === 'horizontalLeft' ||
        animationDirection === 'horizontalRight'
      ) {
        direction = { x: 1, y: 0 };
      } else if (
        animationDirection === 'verticalTop' ||
        animationDirection === 'verticalDown'
      ) {
        direction = { x: 0, y: 1 };
      } else if (
        animationDirection === 'diagonalTopRight' ||
        animationDirection === 'diagonalDownRight' ||
        animationDirection === 'diagonalDownLeft' ||
        animationDirection === 'diagonalTopLeft'
      ) {
        const boneWidth = getBoneWidth(boneLayout);
        const boneHeight = getBoneHeight(boneLayout);
        if (boneWidth && boneHeight && boneWidth > boneHeight)
          return { x: 0, y: 1 };
        return { x: 1, y: 0 };
      }
    }
    return direction;
  };

  const getBoneStyles = (boneLayout: ICustomViewStyle): ICustomViewStyle => {
    const { backgroundColor, borderRadius } = boneLayout;
    const boneWidth = getBoneWidth(boneLayout);
    const boneHeight = getBoneHeight(boneLayout);
    const boneStyle: ICustomViewStyle = {
      width: boneWidth,
      height: boneHeight,
      borderRadius: borderRadius || DEFAULT_BORDER_RADIUS,
      ...boneLayout,
    };
    if (animationType !== 'pulse') {
      boneStyle.overflow = 'hidden';
      boneStyle.backgroundColor = backgroundColor || boneColor;
    }
    if (
      animationDirection === 'diagonalDownRight' ||
      animationDirection === 'diagonalDownLeft' ||
      animationDirection === 'diagonalTopRight' ||
      animationDirection === 'diagonalTopLeft'
    ) {
      boneStyle.justifyContent = 'center';
      boneStyle.alignItems = 'center';
    }
    return boneStyle;
  };

  const getGradientSize = (boneLayout: ICustomViewStyle): ICustomViewStyle => {
    const boneWidth = getBoneWidth(boneLayout);
    const boneHeight = getBoneHeight(boneLayout);
    const gradientStyle: ICustomViewStyle = {};
    if (
      animationDirection === 'diagonalDownRight' ||
      animationDirection === 'diagonalDownLeft' ||
      animationDirection === 'diagonalTopRight' ||
      animationDirection === 'diagonalTopLeft'
    ) {
      gradientStyle.width = boneWidth;
      gradientStyle.height = boneHeight;
      if (boneHeight >= boneWidth) gradientStyle.height *= 1.5;
      else gradientStyle.width *= 1.5;
    }
    return gradientStyle;
  };

  const getStaticBoneStyles = (
    boneLayout: ICustomViewStyle
  ): (ICustomViewStyle | { backgroundColor: any })[] => {
    const pulseStyles = [
      getBoneStyles(boneLayout),
      {
        backgroundColor: backgroundPulseColor,
      },
    ];
    if (animationType === 'none') pulseStyles.pop();
    return pulseStyles;
  };

  const getPositionRange = (boneLayout: ICustomViewStyle): number[] => {
    const outputRange: number[] = [];
    // use layout dimensions for percentages (string type)
    const boneWidth = getBoneWidth(boneLayout);
    const boneHeight = getBoneHeight(boneLayout);

    if (animationDirection === 'horizontalRight') {
      outputRange.push(-boneWidth, +boneWidth);
    } else if (animationDirection === 'horizontalLeft') {
      outputRange.push(+boneWidth, -boneWidth);
    } else if (animationDirection === 'verticalDown') {
      outputRange.push(-boneHeight, +boneHeight);
    } else if (animationDirection === 'verticalTop') {
      outputRange.push(+boneHeight, -boneHeight);
    }
    return outputRange;
  };

  const getGradientTransform = (boneLayout: ICustomViewStyle): object => {
    let transform = {};
    const boneWidth = getBoneWidth(boneLayout);
    const boneHeight = getBoneHeight(boneLayout);
    if (
      animationDirection === 'verticalTop' ||
      animationDirection === 'verticalDown' ||
      animationDirection === 'horizontalLeft' ||
      animationDirection === 'horizontalRight'
    ) {
      const interpolatedPosition = interpolate(
        animationValue.value,
        [0, 1],
        getPositionRange(boneLayout)
      );
      if (
        animationDirection === 'verticalTop' ||
        animationDirection === 'verticalDown'
      ) {
        transform = { translateY: interpolatedPosition };
      } else {
        transform = { translateX: interpolatedPosition };
      }
    } else if (
      animationDirection === 'diagonalDownRight' ||
      animationDirection === 'diagonalTopRight' ||
      animationDirection === 'diagonalDownLeft' ||
      animationDirection === 'diagonalTopLeft'
    ) {
      const diagonal = Math.sqrt(
        boneHeight * boneHeight + boneWidth * boneWidth
      );
      const mainDimension = Math.max(boneHeight, boneWidth);
      const oppositeDimension =
        mainDimension === boneWidth ? boneHeight : boneWidth;
      const diagonalAngle = Math.acos(mainDimension / diagonal);
      let rotateAngle =
        animationDirection === 'diagonalDownRight' ||
        animationDirection === 'diagonalTopLeft'
          ? Math.PI / 2 - diagonalAngle
          : Math.PI / 2 + diagonalAngle;
      const additionalRotate =
        animationDirection === 'diagonalDownRight' ||
        animationDirection === 'diagonalTopLeft'
          ? 2 * diagonalAngle
          : -2 * diagonalAngle;
      const distanceFactor = (diagonal + oppositeDimension) / 2;
      if (mainDimension === boneWidth && boneWidth !== boneHeight)
        rotateAngle += additionalRotate;
      const sinComponent = Math.sin(diagonalAngle) * distanceFactor;
      const cosComponent = Math.cos(diagonalAngle) * distanceFactor;
      let xOutputRange: number[];
      let yOutputRange: number[];
      if (
        animationDirection === 'diagonalDownRight' ||
        animationDirection === 'diagonalTopLeft'
      ) {
        xOutputRange =
          animationDirection === 'diagonalDownRight'
            ? [-sinComponent, sinComponent]
            : [sinComponent, -sinComponent];
        yOutputRange =
          animationDirection === 'diagonalDownRight'
            ? [-cosComponent, cosComponent]
            : [cosComponent, -cosComponent];
      } else {
        xOutputRange =
          animationDirection === 'diagonalDownLeft'
            ? [-sinComponent, sinComponent]
            : [sinComponent, -sinComponent];
        yOutputRange =
          animationDirection === 'diagonalDownLeft'
            ? [cosComponent, -cosComponent]
            : [-cosComponent, cosComponent];
        if (mainDimension === boneHeight && boneWidth !== boneHeight) {
          xOutputRange.reverse();
          yOutputRange.reverse();
        }
      }
      let translateX = interpolate(animationValue.value, [0, 1], xOutputRange);
      let translateY = interpolate(animationValue.value, [0, 1], yOutputRange);
      // swapping the translates if width is the main dim
      if (mainDimension === boneWidth)
        [translateX, translateY] = [translateY, translateX];
      const rotate = `${rotateAngle}rad`;
      transform = { translateX, translateY, rotate };
    }
    return transform;
  };

  const getBoneContainer = (
    layoutStyle: ICustomViewStyle,
    childrenBones: JSX.Element[],
    key: number | string
  ) => (
    <View key={layoutStyle.key || key} style={layoutStyle}>
      {childrenBones}
    </View>
  );

  const getStaticBone = (
    layoutStyle: ICustomViewStyle,
    key: number | string
  ): JSX.Element => (
    <Animated.View
      key={layoutStyle.key || key}
      style={getStaticBoneStyles(layoutStyle)}
    />
  );

  const getShiverBone = (
    layoutStyle: ICustomViewStyle,
    key: number | string
  ): JSX.Element => {
    const animatedStyle: any = {
      transform: [getGradientTransform(layoutStyle)],
      ...getGradientSize(layoutStyle),
    };
    return (
      <View key={layoutStyle.key || key} style={getBoneStyles(layoutStyle)}>
        <Animated.View style={[styles.absoluteGradient, animatedStyle]}>
          <LinearGradient
            colors={[boneColor!, highlightColor!, boneColor!]}
            start={{ x: 0, y: 0 }}
            end={getGradientEndDirection(layoutStyle)}
            style={styles.gradientChild}
          />
        </Animated.View>
      </View>
    );
  };

  const getBones = (
    bonesLayout: ICustomViewStyle[] | undefined,
    childrenItems: any,
    prefix: string | number = ''
  ): JSX.Element[] => {
    if (bonesLayout && bonesLayout.length > 0) {
      const iterator: number[] = new Array(bonesLayout.length).fill(0);
      return iterator.map((_, i) => {
        // has a nested layout
        if (bonesLayout[i].children && bonesLayout[i].children!.length > 0) {
          const containerPrefix = bonesLayout[i].key || `bone_container_${i}`;
          const { children: childBones, ...layoutStyle } = bonesLayout[i];
          return getBoneContainer(
            layoutStyle,
            getBones(childBones, [], containerPrefix),
            containerPrefix
          );
        }
        if (animationType === 'pulse' || animationType === 'none') {
          return getStaticBone(bonesLayout[i], prefix ? `${prefix}_${i}` : i);
        }
        return getShiverBone(bonesLayout[i], prefix ? `${prefix}_${i}` : i);
      });
      // no layout, matching children's layout
    }
    return React.Children.map(childrenItems, (child, i) => {
      const styling = child.props.style || {};
      if (animationType === 'pulse' || animationType === 'none') {
        return getStaticBone(styling, i);
      }
      return getShiverBone(styling, i);
    });
  };

  return (
    <View style={containerStyle} onLayout={onLayout}>
      {isLoading ? getBones(layout!, children) : children}
    </View>
  );
};

export default React.memo(SkeletonContent);
