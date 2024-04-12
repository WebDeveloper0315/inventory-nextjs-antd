"use client";
import React from "react";
import { Button } from "antd";
import { useRouter } from "next/navigation";

function Custom404() {
  const divStyle: React.CSSProperties = {
    background: `url('/image/404.jpg')`,
    backgroundSize: "cover",
    color: "white", // Set text color to ensure readability
    height: "100vh",
  };

  const buttonContainerStyle: React.CSSProperties = {
    position: "absolute",
    top: "60%",
    left: "35%",
    
  };

  const router = useRouter();
  return (
    <div style={divStyle}>
      <div style={buttonContainerStyle}>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            router.push("/");
          }}
        >
          Go to Home
        </Button>
      </div>
    </div>
  );
}

export default Custom404;
