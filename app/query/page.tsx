/* eslint-disable tailwindcss/no-custom-classname */
"use client";
import GeneralGraph from "@/component/GeneralGraph";
import LocationGraph from "@/component/LocationGraph";
import OneGraph from "@/component/OneGraph";
import PageTitle from "@/component/PageTitle";
import { Button } from "antd";
import React, { useState } from "react";

function Query() {
  const [showGeneral, setShowGeneral] = useState(false);
  const [showOne, setShowOne] = useState(false);
  const [showLocation, setLocation] = useState(false);

  const handleGeneralButtonClick = () => {
    setShowGeneral(true);
    setShowOne(false);
    setLocation(false);
  };

  const handleOneButtonClick = () => {
    setShowGeneral(false);
    setShowOne(true);
    setLocation(false);
  };

  const handleLocationButtonClick = () => {
    setShowGeneral(false);
    setShowOne(false);
    setLocation(true);
  };

  return (
    <div className="my-3">
      <PageTitle title="Query" />
      <div className="flex flex-col items-center">
        <div className="flex w-full justify-center sm:w-1/2">
          <Button
            type="primary"
            block
            onClick={handleOneButtonClick}
            className="mx-3"
          >
            <i className="ri-bar-chart-2-fill">&nbsp;One Product</i>
          </Button>
          <Button
            type="primary"
            block
            onClick={handleGeneralButtonClick}
            className="mx-3"
          >
            <i className="ri-line-chart-line">&nbsp;General</i>
          </Button>
          <Button
            type="primary"
            block
            onClick={handleLocationButtonClick}
            className="mx-3"
          >
            <i className="ri-map-pin-line">&nbsp;Location</i>
          </Button>
        </div>

        <div className="mt-6 flex w-full justify-center sm:w-1/2">
          {showOne && <OneGraph />}
          {showGeneral && <GeneralGraph />}
          {showLocation && <LocationGraph />}
        </div>
      </div>
    </div>
  );
}

export default Query;
