import { RedoService } from '../services/redo.service.js';

const redoService = new RedoService();

export class RedoController {
  async executeRedo(req, res) {
    try {
      const result = await redoService.executeRedo();

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Processo de REDO finalizado com sucesso.',
          redoTransactionsList: result.redoTransactionsList,
          appliedData: result.appliedData
        });
      } else {
        return res.status(200).json({
          success: false,
          message: 'Processo de REDO falhou ou encontrou erros.',
          redoTransactionsList: result.redoTransactionsList, 
          appliedData: result.appliedData                   
        });
      }
    } catch (error) {
      console.error('Erro inesperado no RedoController:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao tentar realizar a operação de REDO.',
        redoTransactionsList: [],
        appliedData: []
      });
    }
  }
}