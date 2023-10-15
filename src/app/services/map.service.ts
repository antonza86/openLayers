import { Injectable } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { transform } from 'ol/proj';
import { Style, Fill, Stroke } from 'ol/style';
import { GeoPoint } from '../interfaces/geo';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  constructor() { }

  getStyle(index: number): Style {
    const styles = [
      new Style({
        fill: new Fill({
          color: 'rgba(100, 150, 200, 0.5)' // Azul
        }),
        stroke: new Stroke({
          color: '#000',
          width: 2
        })
      }),
      new Style({
        fill: new Fill({
          color: 'rgba(200, 100, 150, 0.5)' // Rosa
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 2
        })
      }),
      new Style({
        fill: new Fill({
          color: 'rgba(150, 200, 100, 0.5)' // Verde
        }),
        stroke: new Stroke({
          color: '#666',
          width: 2
        })
      })
    ];
    return styles[index]
  }

  getShapeName(index: number): string {
    const names = [
      'Madrid central', 'Embajadores', 'Retiro'
    ]
    return names[index];
  }

  getShapes() {
    const madridCenter = this.transformCoord({ lat: 40.4168, lng: -3.7038 });

    // Tamaño de las formas (cuadrados o triángulos)
    const size = 2000;  // 2km

    const shapes = [
      // Cuadrado central
      [
        [madridCenter[0] - size / 2, madridCenter[1] - size / 2], // left button
        [madridCenter[0] + size / 2, madridCenter[1] - size / 2], // right button
        [madridCenter[0] + size / 2, madridCenter[1] + size / 2], // right top
        [madridCenter[0] - size / 2, madridCenter[1] + size / 2], // left top
        [madridCenter[0] - size / 2, madridCenter[1] - size / 2]  // left button(close square)
      ],
      [
        [madridCenter[0] - size / 2, madridCenter[1] - size / 2], // start point
        [madridCenter[0], madridCenter[1] - size],
        [madridCenter[0] + size / 2, madridCenter[1] - size / 2],
        [madridCenter[0] - size / 2, madridCenter[1] - size / 2], // end point
      ],
      [
        [madridCenter[0] + size / 2, madridCenter[1] - size / 2],
        [madridCenter[0] + size / 2, madridCenter[1] + size / 2],
        [madridCenter[0] + size, madridCenter[1] + size],
        [madridCenter[0] + size, madridCenter[1] - size],
        [madridCenter[0] + size / 2, madridCenter[1] - size / 2],
      ]
    ];
    return shapes;
  }

  transformCoord(point: GeoPoint): Coordinate {
    return transform([point.lng, point.lat], 'EPSG:4326', 'EPSG:3857');
  }
}
