import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import hospitalIcon from "./assets/hospital.svg";
import schoolIcon from "./assets/school.svg";
import restaurantIcon from "./assets/restaurant.svg";
import templeIcon from "./assets/temple.svg";

// Validation Schema for form using Yup Library
const validationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  latitude: Yup.number().required("Latitude is required"),
  longitude: Yup.number().required("Longitude is required"),
  type: Yup.string().required("Type is required"),
});

// icons for the marker
const amenityIcons = {
  hospital: hospitalIcon,
  school: schoolIcon,
  restaurant: restaurantIcon,
  place_of_worship: templeIcon,
};

// Dropdown Options
const typeOptions = [
  { id: 1, label: "Restaurant", value: "restaurant" },
  { id: 2, label: "Hospital", value: "hospital" },
  { id: 3, label: "School", value: "school" },
  { id: 4, label: "Temple", value: "place_of_worship" },
];

export default function App() {
  const [queryBy, setQueryBy] = useState("");
  const [queryResult, setQueryResult] = useState([]);
  const [inputFromForm, setInputFromForm] = useState(null);
  const mapRef = useRef(null);

  /*
     this useEffect initializes a Leaflet map, fetches data related to the map on component mount, and cleans up resources when the component is unmounted or when the queryBy dependency changes. it has has a dependency array [queryBy], meaning it will run the effect whenever the value of queryBy changes. This ensures that the map is reinitialized and data is refetched whenever queryBy changes.
  */
  useEffect(() => {
    mapRef.current = createMap();

    (async () => {
      const data = await fetchQueryDetail(queryBy);
      setQueryResult(data);
    })();

    return () => {
      mapRef.current.remove();
    };
  }, [queryBy, inputFromForm]);

  useEffect(() => {
    // It sets the icon based on the queryBy variable
    const selectedIcon = L.icon({
      iconUrl: amenityIcons[queryBy],
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    /*this code removes all marker layers from the Leaflet map referenced by mapRef.current. It can be useful when you want to clear or update the map by removing existing marker layers.*/
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current.removeLayer(layer);
      }
    });

    /*This code iterates over elements in the queryResult array and creates a Leaflet marker for each element on the Leaflet map referenced by mapRef.current.*/
    queryResult?.forEach((obj) => {
      const marker = L.marker([obj.lat, obj.lon], {
        icon: selectedIcon,
      }).addTo(mapRef.current);

      // It defines the content for the marker's popup.
      const popupContent = `<div><b>Name: ${obj?.tags?.name}</b> <br/> <b>latitude: ${obj?.lat}</b> <br/> <b>longitude: ${obj?.lon}</b></div>`;

      // It binds the popup content to the marker, associating the popup with the specific marker on the map.
      marker.bindPopup(popupContent);
    });
  }, [queryResult, queryBy]);

  // createMap function creates a leaflet map using the leaflet library and it returns a Leaflet map instance
  function createMap() {
    return L.map("map", {
      center: inputFromForm
        ? [inputFromForm?.latitude, inputFromForm?.longitude]
        : [28.7041, 77.1025],
      zoom: 13,
      layers: [
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        }),
      ],
    });
  }

  // fetchQueryDetail function fetches data from the Overpass API and return the result
  async function fetchQueryDetail(queryBy) {
    try {
      if (inputFromForm) {
        const response = await fetch(
          `https://overpass-api.de/api/interpreter?data=[out:json];node(around:5000,${inputFromForm.latitude},${inputFromForm.longitude})[amenity=${queryBy}];out;`
        );

        const responseJson = await response.json();
        return responseJson?.elements;
      }
    } catch (error) {
      console.error(`Error fetching ${queryBy} data:`, error);
      return [];
    }
  }

  useEffect(() => {
    // console.log(inputFromForm);
  }, [inputFromForm]);

  return (
    <div className="app">
      <Formik
        initialValues={{
          name: "",
          latitude: "",
          longitude: "",
          type: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          setInputFromForm(values);
          setQueryBy(values.type);
          setSubmitting(false);
        }}
      >
        {({ isSubmitting }) => (
          <Form className="form-container">
            {/* Email Field */}
            <div>
              <label>Name</label>
              <Field
                type="text"
                name="name"
                placeholder="Name"
                className="input-field-error"
              />
              <ErrorMessage
                name="name"
                component="div"
                className="formik-error-message"
              />
            </div>

            {/* Latitude and Longitude Fields */}
            <div>
              <label>Latitude</label>
              <Field
                type="number"
                name="latitude"
                placeholder="Latitude"
                className="input-field-error"
              />
              <ErrorMessage
                name="latitude"
                component="div"
                className="formik-error-message"
              />
            </div>
            <div>
              <label>Longitude</label>
              <Field
                type="number"
                name="longitude"
                placeholder="Longitude"
                className="input-field-error"
              />
              <ErrorMessage
                name="longitude"
                component="div"
                className="formik-error-message"
              />
            </div>

            {/* Type Dropdown */}
            <div>
              <label>Type</label>
              <Field as="select" name="type" className="input-field-error">
                {typeOptions?.map((option) => (
                  <option key={option.id} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Field>
              <ErrorMessage
                name="type"
                component="div"
                className="formik-error-message"
              />
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isSubmitting}>
              Submit
            </button>
          </Form>
        )}
      </Formik>
      <div>
        <select
          className="select-amenity"
          value={queryBy}
          onChange={(event) => {
            const selectedValue = event.target.value;
            setQueryBy(selectedValue);
          }}
        >
          {typeOptions.map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div id="map"></div>
      </div>
    </div>
  );
}
