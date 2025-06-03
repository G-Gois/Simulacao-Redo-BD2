import { Router } from "express";
import { RedoController } from "../controllers/redo.controller.js"; 

const redoController = new RedoController(); 
const router = Router(); 


router.post('/execute', redoController.executeRedo);


export default router;