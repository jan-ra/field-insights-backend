import { Injectable } from '@nestjs/common';
import * as ee from '@google/earthengine';
import * as moment from 'moment';
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

    //apply cloud masks
    s2_sr = s2_sr.map((i) => this.maskS2clouds(i));
    s2_sr = s2_sr.map((i) => this.keepFieldPixel(i));

    // apply index layers
    s2_sr = s2_sr.map((i) => this.getNDVI(i));
    s2_sr = s2_sr.map((i) => this.getEVI(i));
    s2_sr = s2_sr.map((i) => this.getNDWI(i));

    //filter correct ima
    const col = s2_sr
      .filterBounds(polygon)
      .filterDate('2021', '2022')
      .select(['NDVI', 'NDWI', 'EVI']);

    let image = col.first();
    let ndvis = col.map((i) => {
      const reduce = i
        .reduceRegion(ee.Reducer.mean(), polygon)
        .select(['NDVI', 'EVI', 'NDWI']);
      return ee.Feature(null, {
        date: i.date().format('YYYY-MM-dd'),
        NDVI: reduce.get('NDVI'),
        EVI: reduce.get('EVI'),
        NDWI: reduce.get('NDWI'),
      });
    });

    const res = ndvis.getInfo();
    //console.log(image.getInfo());
    //console.log(res.features.map((e) => e.properties));

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
    const NDWI = image
      .expression('(GREEN - NIR ) / (GREEN + NIR)', {
        NIR: image.select('B8').divide(10000),
        GREEN: image.select('B3').divide(10000),
      })
      .rename('NDWI');

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
}
