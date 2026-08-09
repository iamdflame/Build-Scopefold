import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scopefoldRouter from "./scopefold";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scopefoldRouter);

export default router;
