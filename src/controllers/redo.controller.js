// redo.controller.js (AJUSTADO)
import { RedoService } from '../services/redo.service.js'; // Ajuste o caminho se necessário

const redoService = new RedoService();

export class RedoController {
  async executeRedo(req, res) {
    try {
      const redoSuccess = await redoService.executeRedo(); 

      if (redoSuccess) {
        res.status(200).json({
          success: true,
          message: 'Processo de REDO finalizado com sucesso.'
        });
      } else {
        res.status(200).json({ 
          success: false,
          message: 'Processo de REDO falhou ou encontrou erros.'
        });
      }
    } catch (error) {
      console.error('Erro inesperado no RedoController:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao tentar realizar a operação de REDO.',
      });
    }
  }
}