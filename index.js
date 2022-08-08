import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Image
} from 'react-native';
import CameraRoll from "@react-native-community/cameraroll";
import { responsiveHeight, responsiveWidth, responsiveFontSize } from 'react-native-responsive-dimensions';
import I18n from 'react-native-i18n';
import { Actions } from 'react-native-router-flux';
import ViewOverflow from 'react-native-view-overflow';
import PropTypes from 'prop-types';
import Row from './Row';

import ImageItem from './ImageItem';

const styles = StyleSheet.create({
  wrapper:{
    flexGrow: 1,
  },
  loader: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row:{
    flexDirection: 'row',
    flex: 1,
  },
  marker: {
    position: 'absolute',
    top: 5,
    backgroundColor: 'transparent',
  },
  nextButton: {
     position: 'absolute',
     bottom: responsiveWidth(10),
     right: responsiveWidth(5),
     resizeMode: 'contain',
     marginBottom: responsiveWidth(2.5),
     opacity: 1
   },
  doneButton: {
     width: 50,
     height: 50,
     borderRadius: 50,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgb(226, 61, 141)',
     shadowColor: 'rgb(0, 0, 0)',
     shadowOffset: { width: 0, height: 8 },
     shadowRadius: 8,
     shadowOpacity: 0.2,
     elevation: 2
   },
   doneText: {
     color: 'white',
     fontFamily: 'HurmeGeometricSans2-SemiBold',
     fontSize: 14,
     alignSelf: 'center',
     lineHeight: 50
   },
   countBadge: {
     position: 'absolute',
     right: -2.5,
     top: -5,
     elevation: 3,
     backgroundColor: 'white',
     width: 21,
     height: 21,
     borderRadius: 10,
     borderWidth: 1.5,
     borderColor: 'rgb(226, 61, 141)',
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: 'rgb(0, 0, 0)',
     shadowOffset: { width: 0, height: 8 },
     shadowRadius: 8,
     shadowOpacity: 0.2
   },
   count: {
     color: 'rgb(226, 61, 141)',
     fontFamily: 'HurmeGeometricSans2-SemiBold',
     fontSize: responsiveFontSize(1.5),
     lineHeight: 18
   },
})

// helper functions
const arrayObjectIndexOf = (array, property, value) => array.map(o => o[property]).indexOf(value);

const nEveryRow = (data, n) => {
  const result = [];
  let temp = [];

  for (let i = 0; i < data.length; ++i) {
    if (i > 0 && i % n === 0) {
      result.push(temp);
      temp = [];
    }
    temp.push(data[i]);
  }

  if (temp.length > 0) {
    while (temp.length !== n) {
      temp.push(null);
    }
    result.push(temp);
  }

  return result;
};

class CameraRollPicker extends Component {
  constructor(props) {
    super(props);
    props.groupName = "";
    this.state = {
      images: [],
      selected: this.props.selected,
      lastCursor: null,
      initialLoading: true,
      loadingMore: false,
      noMore: false,
      data: [],
      groupName: null,
    };

    this.renderFooterSpinner = this.renderFooterSpinner.bind(this);
    this.onEndReached = this.onEndReached.bind(this);
    this.renderRow = this.renderRow.bind(this);
    this.selectImage = this.selectImage.bind(this);
    this.renderImage = this.renderImage.bind(this);
  }

  componentWillMount() {
    this.fetch();
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.groupName !== this.props.groupName) {
      this.setState({
        images: [],
        selected: [],
        lastCursor: null,
        initialLoading: true,
        loadingMore: false,
        noMore: false,
        data: [],
        groupName: this.props.groupName,
      }, this.fetch)
    } else {
      this.setState({
        selected: nextProps.selected,
      });
    }

  }

  onEndReached() {
    if (!this.state.noMore) {
      this.fetch();
    }
  }

  onCameraPress() {
    Actions.pop();
  }

  onPhotoUploadPress() {
    this.props.submitAction();
  }

  appendImages(data) {
    const assets = data.edges;
    const newState = {
      loadingMore: false,
      initialLoading: false,
    };

    if (!data.page_info.has_next_page) {
      newState.noMore = true;
    }

    if (assets.length > 0) {
      newState.groupName = this.props.groupName;
      newState.lastCursor = data.page_info.end_cursor;
      newState.images = this.state.images.concat(assets);
      newState.data = nEveryRow(newState.images, this.props.imagesPerRow);
    }

    this.setState(newState);
  }

  fetch() {
    if (!this.state.loadingMore) {
      this.setState({ loadingMore: true }, () => { this.doFetch(); });
    }
  }

  doFetch() {
    const { groupTypes, assetType, groupName } = this.props;

    const fetchParams = {
      first: 100,
      groupTypes,
      assetType,
    };

    if(this.props.groupName) {
      fetchParams.groupName = groupName;
    }

    if (Platform.OS === 'android') {
      // not supported in android
      delete fetchParams.groupTypes;
    }

    if (this.state.lastCursor) {
      fetchParams.after = this.state.lastCursor;
    }

    CameraRoll.getPhotos(fetchParams)
      .then(data => this.appendImages(data), e => console.log(e));
  }

  selectImage(image) {
    const {
      maximum, imagesPerRow, callback, selectSingleItem,
    } = this.props;

    const { selected } = this.state;
    const index = arrayObjectIndexOf(selected, 'uri', image.uri);

    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      if (selectSingleItem) {
        selected.splice(0, selected.length);
      }
      if (selected.length < maximum) {
        selected.push(image);
      }
    }

    this.setState({
      selected,
      data: nEveryRow(this.state.images, imagesPerRow),
    });

    callback(selected, image);
  }

  renderImage(item) {
    const { selected } = this.state;
    const {
      imageMargin,
      selectedMarker,
      imagesPerRow,
      containerWidth,
    } = this.props;

    const { uri } = item.node.image;
    console.log(uri);
    var selectedIndex = arrayObjectIndexOf(selected, 'uri', uri);
    console.log(selectedIndex);
    const isSelected = (arrayObjectIndexOf(selected, 'uri', uri) >= 0);
    console.log(isSelected);

    return (
      <ImageItem
        key={uri}
        item={item}
        selected={isSelected}
        imageMargin={imageMargin}
        selectedMarker={selectedMarker}
        selectedIndex={selectedIndex}
        imagesPerRow={imagesPerRow}
        containerWidth={containerWidth}
        onClick={this.selectImage}
      />
    );
  }

  renderRow(item) { // item is an array of objects
    const isSelected = item.map((imageItem) => {
      if (!imageItem) return false;
      const { uri } = imageItem.node.image;
      return arrayObjectIndexOf(this.state.selected, 'uri', uri) >= 0;
    });
    const selectedIndex = item.map((imageItem) => {
      if (!imageItem) return false;
      const { uri } = imageItem.node.image;
      return arrayObjectIndexOf(this.state.selected, 'uri', uri);
    });
    return (<Row
      rowData={item}
      isSelected={isSelected}
      selectedIndex={selectedIndex}
      selectImage={this.selectImage}
      imagesPerRow={this.props.imagesPerRow}
      containerWidth={this.props.containerWidth}
      imageMargin={this.props.imageMargin}
      selectedMarker={this.props.selectedMarker}
    />);
  }

  renderFooterSpinner() {
    if (!this.state.noMore) {
      return <ActivityIndicator style={styles.spinner} />;
    }
    return null;
  }

  render() {
    const {
      initialNumToRender,
      imageMargin,
      backgroundColor,
      emptyText,
      emptyTextStyle,
      loader,
    } = this.props;

    if (this.state.initialLoading) {
      return (
        <View style={[styles.loader, { backgroundColor }]}>
          { loader || <ActivityIndicator /> }
        </View>
      );
    }

    const flatListOrEmptyText = this.state.data.length > 0 ? (
      <FlatList
        style={{ flex: 1 }}
        ListFooterComponent={this.renderFooterSpinner}
        initialNumToRender={initialNumToRender}
        onEndReached={this.onEndReached}
        renderItem={({ item }) => this.renderRow(item)}
        keyExtractor={item => item[0].node.image.uri}
        data={this.state.data}
        extraData={this.state.selected}
      />
    ) : (
      <Text style={[{ textAlign: 'center' }, emptyTextStyle]}>{emptyText}</Text>
    );

    return (
      <View
        style={[styles.wrapper, { padding: imageMargin, paddingRight: 0, backgroundColor }]}
      >
        {flatListOrEmptyText}
        {this.renderActionButton(this.state.selected.length)}
      </View>
    );
  }

  renderActionButton(count) {
    if(count) {
      return (
        <ViewOverflow style={[styles.nextButton]}>
          <TouchableWithoutFeedback onPress={this.onPhotoUploadPress.bind(this)}>
            <ViewOverflow>
              <View style={styles.doneButton}>
                <Text style={styles.doneText}>{I18n.t('DONE')}</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.count}>{this.state.selected.length}</Text>
              </View>
            </ViewOverflow>
          </TouchableWithoutFeedback>
        </ViewOverflow>
      )
    }
    return (
      <View style={[styles.nextButton]}>
        <TouchableWithoutFeedback onPress={this.onCameraPress.bind(this)}>
          <View style={[styles.doneButton, { backgroundColor: '#fff' }]}>
            <Image source={require('../../src/images/add-photo-button.png')} />
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }
}

CameraRollPicker.propTypes = {
  initialNumToRender: PropTypes.number,
  groupTypes: PropTypes.oneOf([
    'Album',
    'All',
    'Event',
    'Faces',
    'Library',
    'PhotoStream',
    'SavedPhotos',
  ]),
  maximum: PropTypes.number,
  assetType: PropTypes.oneOf([
    'Photos',
    'Videos',
    'All',
  ]),
  selectSingleItem: PropTypes.bool,
  imagesPerRow: PropTypes.number,
  imageMargin: PropTypes.number,
  containerWidth: PropTypes.number,
  callback: PropTypes.func,
  selected: PropTypes.array,
  selectedMarker: PropTypes.element,
  backgroundColor: PropTypes.string,
  emptyText: PropTypes.string,
  emptyTextStyle: Text.propTypes.style,
  loader: PropTypes.node,
};

CameraRollPicker.defaultProps = {
  initialNumToRender: 5,
  groupTypes: 'SavedPhotos',
  maximum: 15,
  imagesPerRow: 3,
  imageMargin: 5,
  selectSingleItem: false,
  assetType: 'Photos',
  backgroundColor: 'white',
  selected: [],
  callback(selectedImages, currentImage) {
    console.log(currentImage);
    console.log(selectedImages);
  },
  emptyText: 'No photos.',
};

export default CameraRollPicker;
