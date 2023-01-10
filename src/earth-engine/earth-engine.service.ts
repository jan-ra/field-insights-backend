import { Injectable } from '@nestjs/common';
import * as ee from '@google/earthengine';
const privateKey = require('../../ee-key.json');
@Injectable()
export class EarthEngineService {
  constructor() {
    ee.data.authenticateViaPrivateKey(privateKey);
  }

  getmap() {
    const image = new ee.Image('srtm90_v4');
    image.getMap({ min: 0, max: 1000 }, function (map) {
      console.log(map);
    });
  }
}
