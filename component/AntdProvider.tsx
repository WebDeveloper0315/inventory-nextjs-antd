/* eslint-disable tailwindcss/no-custom-classname */
"use client";
import React, { useEffect, useState } from "react";
import { ConfigProvider, message, theme } from "antd";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { SetCurrentUser } from "@/redux/usersSlice";
import Loader from "./Loader";
import { SetLoading } from "@/redux/loadersSlice";
import { CgAdd } from "react-icons/cg"; 
import { MdSell } from "react-icons/md"; 
import { RiRefund2Fill } from "react-icons/ri"; 
import { FaSellsy } from "react-icons/fa"; 
import { AiOutlineUserAdd , AiFillCloseCircle } from "react-icons/ai"; 
import { GiHamburgerMenu } from "react-icons/gi"; 
import { FiLogOut } from "react-icons/fi"; 
 

function AntdProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useSelector((state: any) => state.users);
  const { loading } = useSelector((state: any) => state.loaders);
  const dispatch = useDispatch();
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(true);
  const [menuItems, setMenuItems] = useState([
    {
      name: " ",
      path: " ",
      icon: " " as React.ReactNode,
    },
    {
      name: " ",
      path: " ",
      icon: " " as React.ReactNode,
    },
    {
      name: " ",
      path: " ",
      icon: " " as React.ReactNode,
    },
    {
      name: " ",
      path: " ",
      icon: " " as React.ReactNode,
    },
    {
      name: " ",
      path: " ",
      icon: " " as React.ReactNode,
    },
  ]);

  const pathname = usePathname();

  const getCurrentUser = async () => {
    try {
      dispatch(SetLoading(true));

      const response = await axios.get("/api/users/currentuser");
      let pos: number = 0;

      const isNewProduct = response.data.data.newProduct === true;
      const isReturning = response.data.data.returning === true;
      const isSold = response.data.data.sold === true;
      const isQuery = response.data.data.query === true;
      const isAddUser = response.data.data.addUser === true;
      dispatch(SetCurrentUser(response.data.data));

      // console.log('isSold', isSold)
      if (isNewProduct) {
        const tempMenuItems = menuItems;
        tempMenuItems[pos].name = "New Product";
        tempMenuItems[pos].path = "/newproduct";
        tempMenuItems[pos].icon = <CgAdd />;
        setMenuItems(tempMenuItems);
        pos = pos + 1;
      }
      // console.log(pos)
      if (isSold) {
        const tempMenuItems = menuItems;
        tempMenuItems[pos].name = "Sold";
        tempMenuItems[pos].path = "/sold";
        tempMenuItems[pos].icon = <MdSell />;
        setMenuItems(tempMenuItems);
        pos = pos + 1;
      }

      if (isReturning) {
        const tempMenuItems = menuItems;
        tempMenuItems[pos].name = "Item Return";
        tempMenuItems[pos].path = "/returning";
        tempMenuItems[pos].icon = <RiRefund2Fill />;
        setMenuItems(tempMenuItems);
        pos = pos + 1;
      }
      // console.log(pos)
      if (isQuery) {
        const tempMenuItems = menuItems;
        tempMenuItems[pos].name = "Query";
        tempMenuItems[pos].path = "/query";
        tempMenuItems[pos].icon = <FaSellsy />;
        setMenuItems(tempMenuItems);
        pos = pos + 1;
      }
      if (isAddUser) {
        const tempMenuItems = menuItems;
        tempMenuItems[pos].name = "Add User";
        tempMenuItems[pos].path = "/adduser";
        tempMenuItems[pos].icon = <AiOutlineUserAdd />;
        setMenuItems(tempMenuItems);
        pos = pos + 1;
      }

      if (pos < 5) {
        while (pos < 5) {
          const tempMenuItems = menuItems;
          tempMenuItems[pos].name = "";
          tempMenuItems[pos].path = "";
          tempMenuItems[pos].icon = "";
          setMenuItems(tempMenuItems);
          pos = pos + 1;
        }
      }
    } catch (error: any) {
      router.push("/login");
      // console.log(error);
      message.error(
        error.response.data.message || "Error during getting the current user"
      );
    } finally {
      dispatch(SetLoading(false));
    }
  };

  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/register" && !currentUser) {
      getCurrentUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const onLogout = async () => {
    try {
      dispatch(SetLoading(true));
      await axios.post("/api/users/logout");
      message.success("Logout Successfully.");
      dispatch(SetCurrentUser(null));
      router.push("/login");
    } catch (error: any) {
      message.error(error.response.data.message || "Error during logout");
    } finally {
      dispatch(SetLoading(false));
    }
  };
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        components: {
          Button: {
            algorithm: true,
            colorPrimary: "#213555",
            controlHeight: 45
          }
        },
        // token: {
        //   // Seed Token
        //   colorPrimary: "#213555",
        //   borderRadius: 2,

        //   // Alias Token
        //   colorBgContainer: "#f6ffed",
        // },
      }}
    >
      {loading && <Loader />}

      {/* if route is login or register, don't show layout */}
      {pathname === "/login" || pathname === "/register" ? (
        <div>{children}</div>
      ) : (
        currentUser && (
          <div className="layout-parent">
            <div
              className="sidebar"
              style={{
                width: isSidebarExpanded ? "250px" : "auto",
              }}
            >
              <div className="logo">
                {isSidebarExpanded && <h1>Side Panel</h1>}
                {!isSidebarExpanded && (
                  <i
                    onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                  ><GiHamburgerMenu /></i>
                )}
                {isSidebarExpanded && (
                  <i
                    onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                  ><AiFillCloseCircle /></i>
                )}
              </div>

              <div className="menu-items">
                {menuItems.map((item, index) => {
                  const isActive = pathname === item.path;
                  return (
                    <div
                      className={`menu-item ${
                        isActive ? "active-menu-item" : ""
                      }`}
                      style={{
                        justifyContent: isSidebarExpanded
                          ? "flex-start"
                          : "center",
                      }}
                      key={index}
                      onClick={() => router.push(item.path)}
                    >
                      {item.icon}
                      <span>{isSidebarExpanded && item.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="user-info flex items-center justify-between">
                {isSidebarExpanded && (
                  <div className="flex flex-col">
                    <span>{currentUser?.name}</span>
                  </div>
                )}
                <i onClick={onLogout}><FiLogOut /></i>
              </div>
            </div>
            <div className="body">{children}</div>
          </div>
        )
      )}
      {/* {children} */}
    </ConfigProvider>
  );
}

export default AntdProvider;
