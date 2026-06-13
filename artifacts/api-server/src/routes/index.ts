import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import secretsRouter from "./secrets";
import activityRouter from "./activity";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/categories", categoriesRouter);
router.use("/secrets", secretsRouter);
router.use("/activity", activityRouter);
router.use("/dashboard", dashboardRouter);

export default router;
