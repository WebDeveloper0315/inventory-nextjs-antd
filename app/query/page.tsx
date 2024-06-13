/* eslint-disable tailwindcss/no-custom-classname */
"use client";
import GeneralGraph from "@/component/GeneralGraph";
import LocationGraph from "@/component/LocationGraph";
import OneGraph from "@/component/OneGraph";
import PageTitle from "@/component/PageTitle";
import { Button } from "antd";
import React, { useState } from "react";
import { BiMap } from "react-icons/bi"; 
import { AiOutlineLineChart , AiOutlineBarChart } from "react-icons/ai"; 
 

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
        <div className="flex w-full justify-center lg:w-1/2">
          <Button
            type="primary"
            block
            onClick={handleOneButtonClick}
            className="mx-3"
          >
            <b className='text-2xl'><AiOutlineBarChart />&nbsp;One Product</b>
          </Button>
          <Button
            type="primary"
            block
            onClick={handleGeneralButtonClick}
            className="mx-3"
          >
            <b className='text-2xl'><AiOutlineLineChart />&nbsp;General</b>
          </Button>
          <Button
            type="primary"
            block
            onClick={handleLocationButtonClick}
            className="mx-3"
          >
            <b className='text-2xl'><BiMap />&nbsp;Location</b>
          </Button>
        </div>

        <div className="mt-6 flex w-full justify-center lg:w-1/2">
          {showOne && <OneGraph />}
          {showGeneral && <GeneralGraph />}
          {showLocation && <LocationGraph />}
        </div>
      </div>
    </div>
  );
}

export default Query;
