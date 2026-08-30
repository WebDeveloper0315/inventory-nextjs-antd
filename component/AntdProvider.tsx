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
  type MenuItem = { name: string; path: string; icon: React.ReactNode };
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const pathname = usePathname();

  const getCurrentUser = async () => {
    try {
      dispatch(SetLoading(true));

      const response = await axios.get("/api/users/currentuser");
      const user = response.data.data;
      dispatch(SetCurrentUser(user));

      // Build the menu immutably from the user's permissions. (The old code
      // mutated the state array in place and re-set the same reference, which
      // is a React anti-pattern that made rendering order-dependent.)
      const nextMenuItems: MenuItem[] = [];
      if (user.newProduct === true) {
        nextMenuItems.push({ name: "New Product", path: "/newproduct", icon: <CgAdd /> });
      }
      if (user.sold === true) {
        nextMenuItems.push({ name: "Sold", path: "/sold", icon: <MdSell /> });
      }
      if (user.returning === true) {
        nextMenuItems.push({ name: "Item Return", path: "/returning", icon: <RiRefund2Fill /> });
      }
      if (user.query === true) {
        nextMenuItems.push({ name: "Query", path: "/query", icon: <FaSellsy /> });
      }
      if (user.addUser === true) {
        nextMenuItems.push({ name: "Add User", path: "/adduser", icon: <AiOutlineUserAdd /> });
      }
      setMenuItems(nextMenuItems);
    } catch (error: any) {
      router.push("/login");
      // console.log(error);
      message.error(
        error?.response?.data?.message || "Error during getting the current user"
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
