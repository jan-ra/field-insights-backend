import { Injectable } from '@nestjs/common';
import * as ee from '@google/earthengine';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

@Injectable()
export class EarthEngineService {
  constructor() {
    const privateKey = JSON.parse(process.env.EE_KEY);

    const runAnalysis = function () {
      ee.initialize(
        null,
        null,
        function () {
          // ... run analysis ...
        },
        function (e) {
          console.error('Initialization error: ' + e);
        },
      );
    };

    ee.data.authenticateViaPrivateKey(privateKey, runAnalysis, function (e) {
      console.error('Authentication error: ' + e);
    });
  }

  getmap() {
    const image = new ee.Image('srtm90_v4');
    image.getMap({ min: 0, max: 1000 }, function (map) {
      console.log(map);
    });
  }

  getSizeOfPolygon(coordinates: any) {
    const polygon = ee.Geometry.Polygon(coordinates);
    const polygonArea = polygon.area().getInfo();
    return polygonArea;
  }

  getCenterOfPolygon(coordinates: any) {
    const polygon = ee.Geometry.Polygon(coordinates);
    const center = polygon.centroid().getInfo();
    return center;
  }

  calculateIndicesOverTime(coordinates: any) {
    const polygon = ee.Geometry.Polygon(coordinates);

    let s2_sr = ee
      .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 30);

    const dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1');

    //apply cloud masks
    s2_sr = s2_sr.map((i) => this.maskS2clouds(i));
    s2_sr = s2_sr.map((i) => this.keepFieldPixel(i));
    /*     s2_sr = s2_sr.map((i) => {
      const id = i.get('system:index');
      const fdw = dw.filter(ee.Filter.eq('system:index', id));
      const dwImage = ee.Image(fdw.first());
      return this.getDW(i, dwImage);
    }, true);
    s2_sr = s2_sr.map((i) => this.keepCropPixels(i)); */

    // apply index layers
    s2_sr = s2_sr.map((i) => this.getNDVI(i));
    s2_sr = s2_sr.map((i) => this.getEVI(i));
    s2_sr = s2_sr.map((i) => this.getNDWI(i));

    //filter correct ima
    const col = s2_sr
      .filterBounds(polygon)
      .filterDate('2022-01', '2022-08')
      .select(['NDVI', 'NDWI', 'EVI']);

    /* col = col.map((i) => {
      const id = i.get('system:index');
      const fdw = dw.filter(ee.Filter.eq('system:index', id));
      const dwImage = ee.Image(fdw.first());
      return this.getDW(i, dwImage);
    }, true);

    col = col.map((i) => this.keepCropPixels(i));

    console.log(col.getInfo()); */

    //let image = col.first();
    //const id = image.get('system:index');
    //const fdw = dw.filter(ee.Filter.eq('system:index', id));
    //const dwImage = ee.Image(fdw.first());

    //image = image.addBands(dwImage, ['crops']);
    //console.log(image.getInfo());

    const ndvis = col.map((i) => {
      const reduce = i
        .reduceRegion(ee.Reducer.mean(), polygon, 50)
        .select(['NDVI', 'EVI', 'NDWI']);
      return ee.Feature(null, {
        date: i.date().format('YYYY-MM-dd'),
        NDVI: reduce.get('NDVI'),
        EVI: reduce.get('EVI'),
        NDWI: reduce.get('NDWI'),
      });
    });

    const res = ndvis.getInfo();
    return res.features.map((e) => e.properties);
  }

  private getNDVI(image: any) {
    const NDVI = image
      .expression('(NIR - RED) / (NIR +  RED)', {
        NIR: image.select('B8').divide(10000),
        RED: image.select('B4').divide(10000),
      })
      .rename('NDVI');

    image = image.addBands(NDVI);
    return image;
  }

  private getNDWI(image: any) {
    const NDWI = image.normalizedDifference(['B3', 'B8']).rename('NDWI');

    image = image.addBands(NDWI);
    return image;
  }

  private getEVI(image: any) {
    const EVI = image
      .expression('2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
        NIR: image.select('B8').divide(10000),
        RED: image.select('B4').divide(10000),
        BLUE: image.select('B2').divide(10000),
      })
      .rename('EVI');

    image = image.addBands(EVI);
    return image;
  }

  private getDW(image: any, dwImage: any) {
    const dimage = ee.Algorithms.If(
      dwImage,
      image.addBands(dwImage, ['crops']),
      null,
    );
    return dimage;
  }

  // this return in the other way of stuff

  private maskS2clouds(image: any) {
    const qa = image.select('QA60');
    const cloudBitMask = 1 << 10;
    const cirrusBitMask = 1 << 11;
    const mask = qa
      .bitwiseAnd(cloudBitMask)
      .eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

    return image.updateMask(mask).selfMask();
  }

  private keepFieldPixel(image) {
    // Select SCL layer
    const scl = image.select('SCL');
    // Select vegetation and soil pixels
    const veg = scl.eq(4); // 4 = Vegetation
    const soil = scl.eq(5); // 5 = Bare soils

    const mask = veg.eq(1).or(soil.eq(1));

    return image.updateMask(mask).selfMask();
  }

  private keepCropPixels(image) {
    const crops = image.select('crops');
    const mask = crops.gt(0.2);
    return image.updateMask(mask).selfMask();
  }

  createTrainingSet() {
    const dataset = ee.FeatureCollection('TIGER/2016/Counties');
    const ex = dataset.first().getInfo();
    console.log(ex);

    console.log(this.calculateIndicesOverTime(ex.geometry.coordinates));
  }
}
