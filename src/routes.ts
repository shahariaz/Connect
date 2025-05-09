import { authRoutes } from "@auth/routes/authRoutes";
import { serverAdapter } from "@service/queue/base.queue";
import { Application } from "express";
import { learnifyRouter } from "./features/learnify/route";
import { currentUserRoutes } from "@auth/routes/currentRoutes";
import { authMiddleware } from "@global/helpers/auth-middleware";
const BASE_PATH = "/api/v1";
export default (app: Application) => {
  const routes = () => {
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, learnifyRouter.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());
    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
    // Only add the queue route if serverAdapter exists
    if (serverAdapter && typeof serverAdapter.getRouter === "function") {
      app.use("/admin/queues", serverAdapter.getRouter());
    } else {
      console.warn(
        "Queue management UI routes not added: serverAdapter is not properly initialized"
      );
    }
  };
  routes();
};
