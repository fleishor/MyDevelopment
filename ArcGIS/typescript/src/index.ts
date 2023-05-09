import esriConfig from "@arcgis/core/config";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import LabelClass from "@arcgis/core/layers/support/LabelClass";
import LayerList from "@arcgis/core/widgets/LayerList";

esriConfig.apiKey = "__MyApiKey__";

class FeatureDescription {
   readonly symbolUrl: string;
   readonly featureUrl: string;

   constructor(featureUrl: string, symbolUrl: string) {
      this.symbolUrl = symbolUrl;
      this.featureUrl = featureUrl;
   }
}

function AddFeatureLayer(map: Map, featureDescription: FeatureDescription) {
   const symbolProperties: PictureMarkerSymbol = new PictureMarkerSymbol({
      url: featureDescription.symbolUrl,
      width: 18,
      height: 18,
   });

   const rendererProp: SimpleRenderer = new SimpleRenderer({
      label: "RendererProp",
      symbol: symbolProperties,
   });

   const labelClass: LabelClass = new LabelClass({
      symbol: {
         type: "text",
         color: "red",
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
         expression: "$feature.Name",
      },
   });

   const popup = {
      "title": "{name}",
      "content": "{description}"
   }

   const featureLayer = new FeatureLayer({
      url: featureDescription.featureUrl,
      apiKey: "__PoiApiKey__",
      renderer: rendererProp,
      labelingInfo: [labelClass],
      popupTemplate: popup
   });
   map.add(featureLayer, 0);
}

function main() {
   const map = new Map({
      basemap: "arcgis-navigation", // Basemap layer service: arcgis-imagery, arcgis-navigation, arcgis-streets, arcgis-topographic
   });

   const view = new MapView({
      map: map,
      center: [12.196879, 49.235245], // Longitude, latitude
      zoom: 12, // Zoom level
      container: "viewDiv", // Div element
   });

   const basemapToggle = new BasemapToggle({
      view: view,
      nextBasemap: "arcgis-imagery",
   });
   view.ui.add(basemapToggle, "bottom-right");

   const layerList = new LayerList({
      view: view
   });
   view.ui.add(layerList, {
      position: "top-left"
    });

   AddFeatureLayer(
      map,
      new FeatureDescription(
         "https://services2.arcgis.com/r6szgV4JEJMilxsc/arcgis/rest/services/hallenbad/FeatureServer/0",
         "http://static.arcgis.com/images/Symbols/Basic/RedStickpin.png",
      )
   );

   AddFeatureLayer(
      map,
      new FeatureDescription(
         "https://services2.arcgis.com/r6szgV4JEJMilxsc/arcgis/rest/services/safaripark/FeatureServer/0",
         "http://static.arcgis.com/images/Symbols/Basic/GreenStickpin.png",
      )
   );

}

main();
