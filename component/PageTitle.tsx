import React from "react";
import Divider from "./Divider";

export default function PageTitle({ title }: { title: string }) {
  return (
    <div className="my-3">
      <h1 className="my-1 text-xl">
        <b>{title}</b>
      </h1>
      <Divider />
    </div>
  );
}
