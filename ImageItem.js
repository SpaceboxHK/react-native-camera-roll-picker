import React, { Component } from 'react';
import {
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
import PropTypes from 'prop-types';

const checkIcon = require('./circle-check.png');


class ImageItem extends Component {
  componentWillMount() {
    let { width } = Dimensions.get('window');
    const { imageMargin, imagesPerRow, containerWidth } = this.props;

    if (typeof containerWidth !== 'undefined') {
      width = containerWidth;
    }
    this.imageSize = (width - (imagesPerRow + 1) * imageMargin) / imagesPerRow;
  }

  handleClick(item) {
    this.props.onClick(item);
  }

  render() {
    const {
      item, selected, selectedMarker, imageMargin, unselectedMarker, selectedIndex
    } = this.props;

    const marker = selectedMarker || (<Image
      style={[styles.marker, { width: 25, height: 25 }]}
      source={checkIcon}
    />);

    const { image } = item.node;
    var markerText = <Text style={styles.markerIndex}>{selectedIndex + 1}</Text>
    return (
      <TouchableOpacity
        style={{ marginBottom: imageMargin, marginRight: imageMargin }}
        onPress={() => this.handleClick(image)}
      >
        <Image
          source={{ uri: image.uri }}
          style={{ height: this.imageSize, width: this.imageSize }}
        />
        <View style={styles.markerContainer}>
          <View style={styles.markerContent}>
            {(selected) ? marker : unselectedMarker }
            {(selected)? markerText: null }
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'transparent',
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 5,
    width: 25,
    height: 25,
    right: 5,
  },
  markerContent: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerIndex: {
    position: 'absolute',
    top: -2,
    lineHeight: 25,
    fontSize: 12,
    color: '#fff',
    fontFamily: 'HurmeGeometricSans2-SemiBold'
  }
})

ImageItem.defaultProps = {
  item: {},
  selected: false,
};

ImageItem.propTypes = {
  item: PropTypes.object,
  selected: PropTypes.bool,
  selectedMarker: PropTypes.element,
  imageMargin: PropTypes.number,
  imagesPerRow: PropTypes.number,
  onClick: PropTypes.func,
};

export default ImageItem;
