import { StopService } from '../services/stop.service.js';

const stopService = new StopService();

export class StopController {
  
  async stopDatabase(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username e password são obrigatórios no body da requisição'
        });
      }

      const result = await stopService.stopPostgreSQL(username, password);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          platform: result.platform
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.message,
          platform: result.platform
        });
      }
    } catch (error) {
      console.error('Erro inesperado no StopController:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao tentar parar o PostgreSQL'
      });
    }
  }

  async startDatabase(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username e password são obrigatórios no body da requisição'
        });
      }

      const result = await stopService.startPostgreSQL(username, password);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          platform: result.platform
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.message,
          platform: result.platform
        });
      }
    } catch (error) {
      console.error('Erro inesperado no StopController:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao tentar iniciar o PostgreSQL'
      });
    }
  }

  async checkStatus(req, res) {
    try {
      const result = await stopService.checkStatus();

      return res.status(200).json({
        success: result.success,
        isRunning: result.isRunning,
        status: result.status,
        platform: result.platform
      });
    } catch (error) {
      console.error('Erro inesperado no StopController:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao verificar status do PostgreSQL'
      });
    }
  }
}