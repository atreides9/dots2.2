import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/app-layout";
import { HomeFeed } from "./components/screens/home-feed";
import { ReaderView } from "./components/screens/reader-view";
import { MyLibrary } from "./components/screens/my-library";
import { Profile } from "./components/screens/profile";
import { Connections } from "./components/screens/connections";
import { ConnectionDetail } from "./components/screens/connection-detail";
import { Login } from "./components/screens/login";
import { Onboarding } from "./components/screens/onboarding";
import { ErrorPage } from "./components/screens/error-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      { 
        index: true, 
        element: <HomeFeed /> 
      },
      { 
        path: "library", 
        element: <MyLibrary /> 
      },
      { 
        path: "profile/:userId?", 
        element: <Profile /> 
      },
      { 
        path: "connections", 
        element: <Connections /> 
      },
      { 
        path: "connections/:connectionUserId", 
        element: <ConnectionDetail /> 
      },
      { 
        path: "login", 
        element: <Login /> 
      },
      { 
        path: "onboarding", 
        element: <Onboarding /> 
      },
      { 
        path: "read/:articleId", 
        element: <ReaderView /> 
      },
      { 
        path: "reader/:articleId", 
        element: <ReaderView /> 
      },
      {
        path: "*",
        element: <ErrorPage />
      },
    ],
  },
]);