import esriConfig from "@arcgis/core/config";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import LabelClass from "@arcgis/core/layers/support/LabelClass";

esriConfig.apiKey = "__MyApiKey__";

function AddSchwimmbadFeatureLayer(map: Map) {
   const symbolProperties: PictureMarkerSymbol = new PictureMarkerSymbol({
      url: "http://static.arcgis.com/images/Symbols/Basic/RedStickpin.png",
      width: 18,
      height: 18,
   });

   const rendererPropSchwimmbad: SimpleRenderer = new SimpleRenderer({
      label: "RendererPropSchwimmbad",
      symbol: symbolProperties,
   });

   const labelClassSchwimmbad: LabelClass = new LabelClass({
      symbol: {
         type: "text",
         color: "red",
      },
      labelPlacement: "above-center",
      labelExpressionInfo: {
         expression: "$feature.NAME",
      },
   });

   const featureLayerSchwimmbad = new FeatureLayer({
      url: "https://services2.arcgis.com/r6szgV4JEJMilxsc/arcgis/rest/services/schwimmbad/FeatureServer/0",
      apiKey: "__PoiApiKey__",
      renderer: rendererPropSchwimmbad,
      labelingInfo: [labelClassSchwimmbad],
   });
   map.add(featureLayerSchwimmbad, 0);
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

   AddSchwimmbadFeatureLayer(map);
}

main();
