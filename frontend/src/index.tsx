import queryClient from "@/apis/queries";
import store from "@/modules/redux/store";
import "@/styles/index.scss";
import "@fontsource/roboto/300.css";
import { QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { Provider } from "react-redux";
import { useRoutes } from "react-router-dom";
import { Router, useRouteItems } from "./Router";
import { Environment } from "./utilities";

const RouteApp = () => {
  const items = useRouteItems();

  return useRoutes(items);
};

export const Entrance = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* TODO: Enabled Strict Mode after react-bootstrap upgrade to bootstrap 5 */}
        {/* <StrictMode> */}
        {Environment.queryDev && <ReactQueryDevtools initialIsOpen={false} />}
        <RouteApp></RouteApp>
        {/* </StrictMode> */}
      </Router>
    </QueryClientProvider>
  </Provider>
);
