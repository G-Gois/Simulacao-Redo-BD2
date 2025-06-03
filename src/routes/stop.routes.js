import { Router } from "express";
import { StopController } from "../controllers/stop.controller.js";

const stopController = new StopController();
const router = Router();

router.post('/stop', stopController.stopDatabase);
router.post('/start', stopController.startDatabase);
router.get('/status', stopController.checkStatus);

export default router;