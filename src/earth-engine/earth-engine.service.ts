import { Injectable } from '@nestjs/common';
import * as ee from '@google/earthengine';
// eslint-disable-next-line @typescript-eslint/no-var-requires
//const privateKey = require('../../ee-key.json');
require('dotenv').config();
@Injectable()
export class EarthEngineService {
  constructor() {
    const privateKey = JSON.parse(process.env.EE_KEY);
    ee.data.authenticateViaPrivateKey(privateKey);
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

  calculateNDVI(coordinates: any) {
    const polygon = ee.Geometry.Polygon(coordinates);

    const collection = this.generateCollection(polygon);
    console.log(collection.getInfo());
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

  private generateCollection(geometry: any) {
    const startDate = ee.Date('2015-04-10');
    const endDate = ee.Date('2016-04-11');

    const nWeeks = ee
      .Number(endDate.difference(startDate, 'week'))
      .subtract(1)
      .round();

    let s2_sr = ee
      .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 20);

    s2_sr = s2_sr.map(this.maskS2clouds);
    s2_sr = s2_sr.map(this.getNDVI);
    s2_sr = s2_sr.map(this.getEVI);

    const byWeek = ee.ImageCollection(
      ee.List.sequence(0, nWeeks, 1).map((n) => {
        const initial = startDate.advance(n, 'week');
        const end = initial.advance(1, 'week');
        const image = s2_sr
          .filterDate(initial, end)
          .filterBounds(geometry)
          .select(['NDVI', 'EVI'])
          .reduce(ee.Reducer.mean());

        const ndvi_evi = ee.Algorithms.If(
          image.bandNames().length().gt(0),
          image.set('system:time_start', initial.millis()),
          ee
            .Image()
            .addBands(0)
            .rename(['NDVI_mean', 'EVI_mean'])
            .selfMask()
            .set('system:time_start', initial.millis()),
        );
        return ndvi_evi;
      }),
    );

    return byWeek;
  }
}
