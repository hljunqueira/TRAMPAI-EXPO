import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import jobsRouter from "./jobs";
import categoriesRouter from "./categories";
import adminRouter from "./admin";
import usersRouter from "./users";
import uploadRouter from "./upload";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(jobsRouter);
router.use(categoriesRouter);
router.use(adminRouter);
router.use(usersRouter);
router.use("/upload", uploadRouter);
router.use(reviewsRouter);

export default router;
