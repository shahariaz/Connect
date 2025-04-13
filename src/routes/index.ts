import { Application } from "express";
import { ErrorHandlerMiddleware } from "@global/middlewares/error-handler.middleware";

// Import your route handlers/controllers here
// Example: import { AuthRoutes } from './authRoutes';

export default (app: Application): void => {
  // Wrap all route handlers with the error catching middleware
  // Example:
  // const routes = new AuthRoutes();
  // app.use('/api/auth', routes.routes());
  // For each route you need to add this pattern:
  // app.use('/your-route-path', YourRouteController.map((routeHandler) =>
  //   ErrorHandlerMiddleware.catchErrors(routeHandler)
  // ));
  // Add any other routes configuration here
};
