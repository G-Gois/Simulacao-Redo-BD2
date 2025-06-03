import { Router } from "express";
import { SqlController } from "../controllers/sql.controller.js";

const sqlController = new SqlController();
const router = Router();

router.post('/execute', sqlController.executeCommands);

router.post('/execute-unsafe', sqlController.executeCommandsUnsafe);

export default router;