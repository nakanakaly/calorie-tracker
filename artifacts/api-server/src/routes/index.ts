import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nutritionScanRouter from "./nutrition-scan";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nutritionScanRouter);

export default router;
