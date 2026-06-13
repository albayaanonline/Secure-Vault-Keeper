import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import secretsRouter from "./secrets";
import activityRouter from "./activity";
import dashboardRouter from "./dashboard";
import storageRouter from "./storage";
import vaultFilesRouter from "./vault-files";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/categories", categoriesRouter);
router.use("/secrets", secretsRouter);
router.use("/activity", activityRouter);
router.use("/dashboard", dashboardRouter);
router.use(storageRouter);
router.use("/vault-files", vaultFilesRouter);

export default router;
