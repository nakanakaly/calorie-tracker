import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nutritionScanRouter from "./nutrition-scan";
import foodEstimateRouter from "./food-estimate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nutritionScanRouter);
router.use(foodEstimateRouter);

export default router;
