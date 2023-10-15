import { Component, OnInit } from '@angular/core';

// Create map
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { GeoJSON } from 'ol/format';

// Transform coordenates

// Marker
import { Feature, Overlay } from 'ol';
import { LineString, Point, Polygon } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import { GeoPoint } from 'src/app/interfaces/geo';
import { MapService } from 'src/app/services/map.service';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { changeLanguage } from 'src/app/state/language.actions';
import { AppState } from 'src/app/interfaces/other';

const osmLayer = new TileLayer({
  source: new OSM()
});

const vectorSource = new VectorSource({
  url: '/assets/layers/example.geojson',  // Asegúrate de proporcionar la ruta correcta a tu archivo GeoJSON
  format: new GeoJSON()
});
const vectorLayer = new VectorLayer({
  source: vectorSource
});


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private markerSource = new VectorSource();
  shapeLayer: VectorLayer<VectorSource> | null = null;
  routeLayer: VectorLayer<VectorSource> | null = null;

  popup?: Overlay;

  map?: Map;
  markersSelect = false;
  globalZoom = 12;

  infoContent: string = '';
  currentLanguage = 'en';
  ignSelected = false;

  constructor(private mapService: MapService, private translate: TranslateService, private store: Store<AppState>) { }

  ngOnInit() {
    this.createMap();
    this.configureLanguageSubscriber();
  }

  configureLanguageSubscriber() {
    this.store.select('language').subscribe((language: string) => {
      this.currentLanguage = language;
      this.translate.use(this.currentLanguage);
    });
  }

  onLanguageChange(event: any) {
    const selectedLanguage = event.target.value;
    this.store.dispatch(changeLanguage({ language: selectedLanguage }));
  }

  toggleMarkers() {
    if (this.map) {
      if (!this.markersSelect) {
        this.createMarker('plazaToros', { lat: 40.432017, lng: -3.663321 });
        this.createMarker('puertaAlcala', { lat: 40.419939, lng: -3.688449 });
      } else {
        this.markerSource.clear();
        this.removeRoute();
      }
      this.markersSelect = !this.markersSelect;
    }
  }

  addRouteBetween() {
    this.drawRoute({ lat: 40.432017, lng: -3.663321 }, { lat: 40.419939, lng: -3.688449 });
  }

  removeRoute() {
    if (this.routeLayer) {
      this.map!.removeLayer(this.routeLayer);
      this.routeLayer = null; // Limpia la referencia para que puedas añadir otra ruta en el futuro si es necesario
    }
  }

  addShape() {
    const shapes = this.mapService.getShapes();

    const source = new VectorSource();

    shapes.forEach((shape, index) => {
      const polygon = new Polygon([shape]);
      const feature = new Feature(polygon);
      const style = this.mapService.getStyle(index);
      feature.setStyle(style);
      feature.set('originalStyle', style);
      feature.set('isOpaque', false);
      feature.set('name', this.mapService.getShapeName(index));
      feature.setId(`shape_${index}`)
      source.addFeature(feature);
    });

    this.shapeLayer = new VectorLayer<VectorSource>({ source });
    this.map!.addLayer(this.shapeLayer);
  }

  removeShape() {
    if (this.shapeLayer && this.map) {
      this.map.removeLayer(this.shapeLayer);
      this.shapeLayer = null;
    }
  }

  handleShapeClick(event: any) {
    const pixel = this.map!.getEventPixel(event.originalEvent);
    const features = this.map!.getFeaturesAtPixel(pixel);

    if (features.length > 0) {
      const clickedFeature = features[0] as Feature;
      console.log('clickedFeature', clickedFeature);

      // Cambia el estilo de la feature cuando se hace clic en ella
      const originalStyle = clickedFeature.get('originalStyle');
      const shapeName = clickedFeature.get('name');
      console.log('originalStyle', originalStyle);
      this.infoContent = `<strong>${this.translate.instant('map.info')}</strong><div>${shapeName}</div>`;
      console.log('infoContent', this.infoContent);

      const currentFill = originalStyle.getFill();
      const currentStroke = originalStyle.getStroke();
      const currentColor = currentFill.getColor();
      let newOpacity;
      let newFill;

      console.log('currentColor', currentColor);
      const rgba = currentColor.match(/(\d+\.?\d*|\.\d+)/g)!.map(Number);
      console.log('rgba', rgba);
      newOpacity = clickedFeature.get('isOpaque') ? 0.5 : 1;
      newFill = new Fill({
        color: `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${newOpacity})`
      });

      clickedFeature.setStyle(new Style({
        fill: newFill,
        stroke: currentStroke
      }));

      clickedFeature.set('isOpaque', newOpacity === 1);
    }
  }

  closeInfo() {
    this.infoContent = '';
  }

  toggleIgnData() {
    if (!this.ignSelected) {
      this.map!.addLayer(vectorLayer);
    } else {
      this.map!.removeLayer(vectorLayer);
    }
    this.ignSelected = !this.ignSelected;
  }

  private drawRoute(start: GeoPoint, end: GeoPoint) {
    // Crea una LineString con los puntos de inicio y final
    const line = new LineString([this.mapService.transformCoord(start), this.mapService.transformCoord(end)]);

    // Crea una feature con la LineString
    const routeFeature = new Feature({
      geometry: line
    });

    // Define un estilo para la ruta
    const routeStyle = new Style({
      stroke: new Stroke({
        color: '#ff0000', // Color rojo
        width: 3
      })
    });
    routeFeature.setStyle(routeStyle);

    // Crea una fuente y una capa para la ruta
    const routeSource = new VectorSource({
      features: [routeFeature]
    });
    this.routeLayer = new VectorLayer<VectorSource>({
      source: routeSource
    });


    // Añade la capa al mapa
    this.map!.addLayer(this.routeLayer);
  }

  private createMap() {
    // Map configuration
    this.map = new Map({
      target: 'map',
      layers: [osmLayer],
      // layers: [osmLayer, vectorLayer],
      view: new View({
        center: this.mapService.transformCoord({ lat: 40.4300, lng: -3.6635 }),
        zoom: this.globalZoom
      })
    });

    // Define marker layer
    const markerLayer = new VectorLayer({
      source: this.markerSource
    });

    this.map.addLayer(markerLayer);

    // Define popup
    this.popup = new Overlay({
      element: document.getElementById('popup')!,
      positioning: 'bottom-center',
      stopEvent: true,
      autoPan: true,
      offset: [0, -25], // Desplaza el popup hacia arriba para que no cubra el punto de clic
    });

    this.map.addOverlay(this.popup);

    // Define click events
    this.mapClickEvents();

  }


  private createMarker(id: string, point: GeoPoint) {
    const markerPoint = this.mapService.transformCoord(point);
    const marker = new Feature({
      geometry: new Point(markerPoint),
      id
    });

    marker.setStyle(new Style({
      image: new Icon({
        anchor: [0.5, 1], // set bottom icon part in coordenates
        src: '/assets/images/marker.png'
      })
    }));

    this.markerSource.addFeature(marker);
  }

  private mapClickEvents() {
    this.map!.on('singleclick', (event) => {
      this.resetAllMarkersStyle();
      // Verifica si el clic fue sobre el marcador
      const features = this.map!.getFeaturesAtPixel(event.pixel);

      if (features.length > 0) {
        const clickedFeature = features[0];
        const markerId = clickedFeature.get('id');
        if (markerId) {
          this.markerClick(clickedFeature as Feature);


          const coordinate = event.coordinate;
          const content = `<h4>${this.translate.instant('map.info')}</h4><p>${markerId}</p>`;
          document.getElementById('popup-content')!.innerHTML = content;
          this.popup!.setPosition(coordinate);
        } else {
          this.handleShapeClick(event);
        }

      } else {
        this.popup!.setPosition(undefined);
        this.closeInfo();
      }
    });
  }

  private resetAllMarkersStyle() {
    const markers = this.markerSource.getFeatures();

    // Define el estilo predeterminado que quieres establecer para los marcadores
    const defaultStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        scale: 1,
        src: '/assets/images/marker.png'
      })
    });

    // Itera sobre todos los marcadores y restablece su estilo
    markers.forEach(marker => marker.setStyle(defaultStyle));
  }

  private markerClick(marker: Feature) {
    console.log('Marker clicked', marker);
    const iconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        scale: 1.8,
        src: '/assets/images/marker.png'
      })
    });
    marker.setStyle(iconStyle);

    const markerCenter = (marker.getGeometry() as Point).getCoordinates();
    this.map!.getView().animate({
      center: markerCenter,
      zoom: 15,
      duration: 400  // Duración de la animación en milisegundos
    });
  }
}
