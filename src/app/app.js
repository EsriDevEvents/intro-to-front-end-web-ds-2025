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
import * as promiseUtils from "@arcgis/core/core/promiseUtils.js";

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
  resourcesUrl: "https://js.arcgis.com/calcite-components/3.0.3/assets",
});

// Set up renderer with custom CIMSymbol
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

// Configure popup template content
const csaPopup = {
  title: "{Farm_Name}",
  content:
    "<b>Pickup address: </b>{Location}<br/><br/><a href={Website}>View website</a><br/><br /> {Main_Products}",
};

// Configure the CSA pickups feature layer
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
  // Set our API key in esri config to access basemaps service
  esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
  mapElement.basemap = "arcgis/community";

  mapElement.highlights = [
    {
      name: "default",
      color: "#B20D30",
      haloOpacity: 0.75
    },
  ];

  mapElement.addLayer(csaPickupsLayer);
  // include all fields from the service in each feature
  csaPickupsLayer.outFields = ["*"];

  // show the default graphic after the map loads (before we set up the hit test)
  feature.graphic = defaultGraphic;

  // Wait for the layer view to be ready before setting up the hitTest below
  const csaPickupsLayerView = await mapElement.whenLayerView(csaPickupsLayer);

  let highlight, objectId;

  // Wrap hit test in JS SDK's debounce util to ensure input function isn't invoked more than once at a time: https://developers.arcgis.com/javascript/latest/api-reference/esri-core-promiseUtils.html#debounce
  const debouncedGraphicUpdate = promiseUtils.debounce(async (event) => {
    const hitTest = await mapElement.hitTest(event, {
      include: csaPickupsLayer,
    });

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
      highlight = csaPickupsLayerView.highlight(result.graphic);
    }
  });

  mapElement.addEventListener("arcgisViewPointerMove", (event) => {
    debouncedGraphicUpdate(event.detail).catch((error) => {
      // Check if the error is caused by a rejected/aborted promise. If it is not, throw the error
      if (!promiseUtils.isAbortError(error)) {
        throw error;
      }
    });
  });

  document.addEventListener("calciteChipGroupSelect", (e) => {
    const products = e.target.selectedItems.map((selected) => selected.value);
    console.log("products", products);

    const featureFilter = {
      where: "Main_Products LIKE '%" + products.join(", ") + "%'",
    };

    csaPickupsLayerView.featureEffect = {
      filter: featureFilter,
      excludedEffect: "opacity(0%)",
    };
    
  })
});
