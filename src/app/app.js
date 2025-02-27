/**
 * This example uses the Distribution build of Calcite Components.
 * Refer to the documentation if switching to the Custom Elements build:
 * https://developers.arcgis.com/calcite-design-system/get-started/#choose-a-build
 **/
import "@esri/calcite-components/dist/calcite/calcite.css";
import { defineCustomElements } from "@esri/calcite-components/dist/loader";

/**
 * ES Modules from the JS Maps SDK
 */
import esriConfig from "@arcgis/core/config";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

/**
 * Map components
 */
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-feature";

/**
 * Custom symbols
 */
import * as farmBuildingCIMSymbol from "../farm-building-cim-symbol.json";

// Load calcite components
defineCustomElements(window, {
  resourcesUrl: "https://js.arcgis.com/calcite-components/2.6.0/assets",
});

const csaRenderer = {
  type: "simple",
  symbol: {
    type: "cim",
    data: {
      type: "CIMSymbolReference",
      symbol: farmBuildingCIMSymbol,
    },
  },
};

const csaPopup = {
  title: "{Farm_Name}",
  content:
    "<b>Pickup address: </b>{Location}<br/><br/><a href={Website}>View website</a>",
};

const csaPickupsLayer = new FeatureLayer({
  url: "https://www.portlandmaps.com/od/rest/services/COP_OpenData_ImportantPlaces/MapServer/188",
  renderer: csaRenderer,
  popupTemplate: csaPopup,
});

const mapElement = document.querySelector("arcgis-map");
const feature = document.querySelector("arcgis-feature");

const defaultGraphic = {
  popupTemplate: {
    content: "Hover over a pickup site to show details.",
  },
};

mapElement.addEventListener("arcgisViewReadyChange", async (event) => {
  console.log("MapView ready", event);
  mapElement.addLayer(csaPickupsLayer);

  feature.graphic = defaultGraphic;
  
  mapElement.addEventListener("arcgisViewPointerMove", (event) => {
    updateFeature();
  })
});

const updateFeature = async () => {
  csaPickupsLayer.outFields = ["*"];


  feature.graphic = defaultGraphic;

  const layerView = await mapElement.hitTest(event, {
    include: csaPickupsLayer
  });
  let highlight, objectId;

  const results = hitTest.results.filter((result) => {
    return result.graphic.layer.popupTemplate;
  });

  const result = results[0];
  const newId = result?.graphic.attributes[csaPickupsLayer.objectIdField];

  if (!newId) {
    highlight?.remove();
    objectId = feature.graphic = defaultGraphic;
  } else if (objectId !== newId) {
    highlight?.remove();
    objectId = newId;
    feature.graphic = result.graphic;
    highlight = layerView.highlight(result.graphic);
  }
}

// Add api key to access basemaps service
esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
mapElement.basemap = "arcgis/community";
